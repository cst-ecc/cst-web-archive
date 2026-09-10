from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "actor", "target_type", "target_id", "ip_address")
    list_filter = ("action", "created_at")
    search_fields = ("actor__email", "description", "target_type", "target_id", "ip_address")
    readonly_fields = (
        "actor", "action", "target_type", "target_id", "description",
        "ip_address", "user_agent", "metadata", "created_at",
    )
    ordering = ("-created_at",)

    def has_module_permission(self, request):
        return bool(request.user.is_active and request.user.is_superuser)

    def has_view_permission(self, request, obj=None):
        return bool(request.user.is_active and request.user.is_superuser)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
