from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def room_name(public_id):
    return f"chat_{str(public_id).replace('-', '')}"


def _group_send(conversation, event):
    layer = get_channel_layer()
    if layer is None:
        return
    async_to_sync(layer.group_send)(room_name(conversation.public_id), event)


def message_payload(message):
    return {
        "id": message.pk,
        "sender_type": message.sender_type,
        "content": message.content,
        "created_at": message.created_at.isoformat(),
        "is_read": message.is_read,
    }


def broadcast_message(conversation, message):
    _group_send(
        conversation,
        {
            "type": "chat.message",
            "message": message_payload(message),
        },
    )


def broadcast_typing(conversation, *, sender_type, is_typing):
    _group_send(
        conversation,
        {
            "type": "chat.typing",
            "sender_type": sender_type,
            "is_typing": bool(is_typing),
        },
    )


def broadcast_read_receipt(conversation, *, reader_type, message_ids):
    ids = [int(message_id) for message_id in message_ids]
    if not ids:
        return
    _group_send(
        conversation,
        {
            "type": "chat.read",
            "reader_type": reader_type,
            "message_ids": ids,
        },
    )
