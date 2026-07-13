"""Admin configuration for annotations app."""
from django.contrib import admin
from django.utils.html import format_html

from .models import ImageUpload, Polygon


@admin.register(ImageUpload)
class ImageUploadAdmin(admin.ModelAdmin):
    list_display  = ["id", "thumbnail", "name", "owner", "is_archived", "uploaded_at"]
    list_filter   = ["is_archived", "uploaded_at"]
    search_fields = ["name", "owner__username", "owner__email"]
    readonly_fields = ["thumbnail_large", "width", "height", "uploaded_at"]

    # Admin sees ALL images — archived and active.
    def get_queryset(self, request):
        return ImageUpload.objects.all().prefetch_related("polygons")

    @admin.display(description="Preview")
    def thumbnail(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:48px;width:auto;border-radius:4px;object-fit:cover;" />',
                obj.image.url,
            )
        return "—"

    @admin.display(description="Image")
    def thumbnail_large(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height:300px;max-width:100%;border-radius:6px;" />',
                obj.image.url,
            )
        return "—"


@admin.register(Polygon)
class PolygonAdmin(admin.ModelAdmin):
    list_display  = ["id", "image", "label", "color", "point_count", "created_at"]
    search_fields = ["label", "image__name", "image__owner__username"]
    list_filter   = ["created_at"]

    @admin.display(description="Points")
    def point_count(self, obj):
        return len(obj.points) if obj.points else 0
