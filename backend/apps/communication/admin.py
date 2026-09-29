from django.contrib import admin

from .models import Contact, ContactReply


class ContactReplyInline(admin.TabularInline):
    model = ContactReply
    extra = 0
    readonly_fields = ("author", "subject", "message", "delivery_status", "sent_at", "created_at")
    can_delete = False


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("subject", "name", "email", "category", "status", "created_at")
    list_filter = ("status", "category", "created_at")
    search_fields = ("name", "first_names", "email", "subject")
    readonly_fields = ("created_at", "updated_at")
    inlines = (ContactReplyInline,)


@admin.register(ContactReply)
class ContactReplyAdmin(admin.ModelAdmin):
    list_display = ("contact", "author", "delivery_status", "created_at", "sent_at")
    list_filter = ("delivery_status", "created_at")
    search_fields = ("subject", "message", "contact__email")
