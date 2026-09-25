from asgiref.sync import async_to_sync
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase, override_settings

from apps.communication.models import ChatMessage, ChatSender, Conversation
from apps.communication.routing import websocket_urlpatterns


@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
)
class VisitorRealtimeProtocolTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.conversation = Conversation.objects.create(visitor_name="Visiteur test")
        self.member_message = ChatMessage.objects.create(
            conversation=self.conversation,
            sender_type=ChatSender.MEMBER,
            content="Réponse non lue",
            is_read=False,
        )

    def test_typing_message_and_read_receipt_events(self):
        async_to_sync(self._exercise_protocol)()
        self.member_message.refresh_from_db()
        self.assertTrue(self.member_message.is_read)
        self.assertTrue(
            ChatMessage.objects.filter(
                conversation=self.conversation,
                sender_type=ChatSender.VISITOR,
                content="Message temps réel",
            ).exists()
        )

    async def _exercise_protocol(self):
        application = URLRouter(websocket_urlpatterns)
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.public_id}/?token={self.conversation.visitor_token}",
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        self.assertEqual((await communicator.receive_json_from())["type"], "ready")

        await communicator.send_json_to({"type": "typing", "is_typing": True})
        typing = await communicator.receive_json_from()
        self.assertEqual(typing["type"], "typing")
        self.assertEqual(typing["sender_type"], ChatSender.VISITOR)
        self.assertTrue(typing["is_typing"])

        await communicator.send_json_to({"type": "read"})
        receipt = await communicator.receive_json_from()
        self.assertEqual(receipt["type"], "read")
        self.assertEqual(receipt["reader_type"], ChatSender.VISITOR)
        self.assertIn(self.member_message.pk, receipt["message_ids"])

        await communicator.send_json_to({"type": "message", "content": "Message temps réel"})
        # Le consumer diffuse d'abord l'arrêt de saisie, puis le message persistant.
        event = await communicator.receive_json_from()
        if event["type"] == "typing":
            event = await communicator.receive_json_from()
        self.assertEqual(event["type"], "message")
        self.assertEqual(event["message"]["content"], "Message temps réel")
        self.assertFalse(event["message"]["is_read"])

        await communicator.disconnect()
