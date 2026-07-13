from django.contrib import admin

from .models import Tag, Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["id", "owner", "title", "status", "priority", "task_date"]
    search_fields = ["title", "owner__username", "owner__email"]
    list_filter = ["status", "priority", "task_date", "created_at"]
    date_hierarchy = "task_date"


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["id", "owner", "name"]
    search_fields = ["name", "owner__username", "owner__email"]
    list_filter = ["owner"]
