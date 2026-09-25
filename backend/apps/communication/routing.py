from django.urls import re_path

from .consumers import BackofficeChatConsumer, VisitorChatConsumer

websocket_urlpatterns = [
    re_path(r"^ws/chat/(?P<public_id>[0-9a-f-]+)/$", VisitorChatConsumer.as_asgi()),
    re_path(
        r"^ws/backoffice/chat/(?P<public_id>[0-9a-f-]+)/$",
        BackofficeChatConsumer.as_asgi(),
    ),
]
