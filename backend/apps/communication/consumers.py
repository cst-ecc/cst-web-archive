from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import Throttled

from apps.audit.models import AuditAction
from apps.audit.services import audit_log
from apps.backoffice.session import VERIFIED_USER_ID

from .models import ChatMessage, ChatSender, Conversation, ConversationStatus
from .rate_limit import enforce_rate_limit
from .realtime import message_payload, room_name

MAX_MESSAGE_LENGTH = 3000


class ChatRoomMixin:
    async def chat_message(self, event):
        await self.send_json({"type": "message", "message": event["message"]})

    async def chat_typing(self, event):
        await self.send_json(
            {
                "type": "typing",
                "sender_type": event["sender_type"],
                "is_typing": bool(event["is_typing"]),
            }
        )

    async def chat_read(self, event):
        await self.send_json(
            {
                "type": "read",
                "reader_type": event["reader_type"],
                "message_ids": event["message_ids"],
            }
        )

    async def _broadcast_message(self, payload):
        await self.channel_layer.group_send(
            self.room,
            {"type": "chat.message", "message": payload},
        )

    async def _broadcast_typing(self, *, sender_type, is_typing):
        await self.channel_layer.group_send(
            self.room,
            {
                "type": "chat.typing",
                "sender_type": sender_type,
                "is_typing": bool(is_typing),
            },
        )

    async def _broadcast_read(self, *, reader_type, message_ids):
        if not message_ids:
            return
        await self.channel_layer.group_send(
            self.room,
            {
                "type": "chat.read",
                "reader_type": reader_type,
                "message_ids": message_ids,
            },
        )

    @database_sync_to_async
    def _mark_messages_read(self, *, reader_type):
        sender_type = ChatSender.MEMBER if reader_type == ChatSender.VISITOR else ChatSender.VISITOR
        ids = list(
            ChatMessage.objects.filter(
                conversation_id=self.conversation_id,
                sender_type=sender_type,
                is_read=False,
            ).values_list("pk", flat=True)
        )
        if ids:
            ChatMessage.objects.filter(pk__in=ids).update(is_read=True)
        return ids


class VisitorChatConsumer(ChatRoomMixin, AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.public_id = self.scope["url_route"]["kwargs"]["public_id"]
        query = parse_qs(self.scope.get("query_string", b"").decode())
        token = (query.get("token") or [""])[0]
        conversation_id = await self._conversation_id_for_token(token)
        if not conversation_id:
            await self.close(code=4403)
            return

        self.conversation_id = conversation_id
        self.room = room_name(self.public_id)
        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()
        await self.send_json({"type": "ready"})

    @database_sync_to_async
    def _conversation_id_for_token(self, token):
        return (
            Conversation.objects.filter(public_id=self.public_id, visitor_token=token)
            .values_list("pk", flat=True)
            .first()
        )

    async def disconnect(self, close_code):
        if hasattr(self, "room"):
            await self._broadcast_typing(sender_type=ChatSender.VISITOR, is_typing=False)
            await self.channel_layer.group_discard(self.room, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event_type = content.get("type")

        if event_type == "typing":
            await self._broadcast_typing(
                sender_type=ChatSender.VISITOR,
                is_typing=bool(content.get("is_typing")),
            )
            return

        if event_type == "read":
            ids = await self._mark_messages_read(reader_type=ChatSender.VISITOR)
            await self._broadcast_read(reader_type=ChatSender.VISITOR, message_ids=ids)
            return

        if event_type == "message":
            message = str(content.get("content", "")).strip()
            if not message or len(message) > MAX_MESSAGE_LENGTH:
                await self.send_json({"type": "error", "detail": "Message invalide."})
                return
            try:
                payload = await self._create_message(message)
            except Throttled:
                await self.send_json(
                    {"type": "error", "detail": "Trop de messages envoyés. Réessayez dans quelques instants."}
                )
                return
            if payload is None:
                await self.send_json({"type": "error", "detail": "Cette conversation est fermée."})
                return
            await self._broadcast_typing(sender_type=ChatSender.VISITOR, is_typing=False)
            await self._broadcast_message(payload)

    @database_sync_to_async
    def _create_message(self, content):
        ip = (self.scope.get("client") or ("unknown", 0))[0] or "unknown"
        enforce_rate_limit(key=f"chat-ws:{ip}", limit=30, window=300)
        with transaction.atomic():
            conversation = Conversation.objects.select_for_update().get(pk=self.conversation_id)
            if conversation.status in {ConversationStatus.CLOSED, ConversationStatus.ARCHIVED}:
                return None
            message = ChatMessage.objects.create(
                conversation=conversation,
                sender_type=ChatSender.VISITOR,
                content=content,
                is_read=False,
            )
            conversation.last_activity_at = timezone.now()
            conversation.save(update_fields=["last_activity_at", "updated_at"])
        return message_payload(message)


class BackofficeChatConsumer(ChatRoomMixin, AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.public_id = self.scope["url_route"]["kwargs"]["public_id"]
        user = self.scope.get("user")
        session = self.scope.get("session")

        if not user or not user.is_authenticated or not user.is_active or not session:
            await self.close(code=4403)
            return

        verified_user_id = await database_sync_to_async(session.get)(VERIFIED_USER_ID)
        can_view = await database_sync_to_async(user.has_perm)("communication.view_conversation")
        if verified_user_id != user.pk or not can_view:
            await self.close(code=4403)
            return

        conversation_id = await self._conversation_id()
        if not conversation_id:
            await self.close(code=4404)
            return

        self.conversation_id = conversation_id
        self.user_id = user.pk
        self.room = room_name(self.public_id)
        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()
        await self.send_json({"type": "ready"})

        ids = await self._mark_messages_read(reader_type=ChatSender.MEMBER)
        await self._broadcast_read(reader_type=ChatSender.MEMBER, message_ids=ids)

    @database_sync_to_async
    def _conversation_id(self):
        return (
            Conversation.objects.filter(public_id=self.public_id)
            .values_list("pk", flat=True)
            .first()
        )

    async def disconnect(self, close_code):
        if hasattr(self, "room"):
            await self._broadcast_typing(sender_type=ChatSender.MEMBER, is_typing=False)
            await self.channel_layer.group_discard(self.room, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event_type = content.get("type")

        if event_type == "typing":
            if await self._can_reply():
                await self._broadcast_typing(
                    sender_type=ChatSender.MEMBER,
                    is_typing=bool(content.get("is_typing")),
                )
            return

        if event_type == "read":
            ids = await self._mark_messages_read(reader_type=ChatSender.MEMBER)
            await self._broadcast_read(reader_type=ChatSender.MEMBER, message_ids=ids)
            return

        if event_type == "message":
            if not await self._can_reply():
                await self.send_json({"type": "error", "detail": "Vous n’êtes pas autorisé à répondre."})
                return
            message = str(content.get("content", "")).strip()
            if not message or len(message) > MAX_MESSAGE_LENGTH:
                await self.send_json({"type": "error", "detail": "Message invalide."})
                return
            payload = await self._create_message(message)
            if payload is None:
                await self.send_json({"type": "error", "detail": "Cette conversation est fermée."})
                return
            await self._broadcast_typing(sender_type=ChatSender.MEMBER, is_typing=False)
            await self._broadcast_message(payload)

    @database_sync_to_async
    def _can_reply(self):
        user = self.scope["user"]
        return user.has_perm("communication.reply_conversation")

    @database_sync_to_async
    def _create_message(self, content):
        user = self.scope["user"]
        with transaction.atomic():
            conversation = Conversation.objects.select_for_update().get(pk=self.conversation_id)
            if conversation.status in {ConversationStatus.CLOSED, ConversationStatus.ARCHIVED}:
                return None
            message = ChatMessage.objects.create(
                conversation=conversation,
                sender_type=ChatSender.MEMBER,
                sender_user=user,
                content=content,
                is_read=False,
            )
            if conversation.status == ConversationStatus.WAITING:
                conversation.status = ConversationStatus.ACTIVE
            if conversation.assigned_to_id is None:
                conversation.assigned_to = user
            conversation.last_activity_at = timezone.now()
            conversation.save(
                update_fields=["status", "assigned_to", "last_activity_at", "updated_at"]
            )
            audit_log(
                action=AuditAction.CHAT_REPLIED,
                actor=user,
                target=conversation,
                description="Réponse envoyée dans la conversation en temps réel.",
            )
        return message_payload(message)
