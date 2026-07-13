"""Models for uploaded images and saved polygon annotations."""
from django.contrib.auth.models import User
from django.db import models


class ImageUpload(models.Model):
    """An image uploaded by a user for annotation."""

    owner      = models.ForeignKey(User, on_delete=models.CASCADE, related_name="images")
    image      = models.ImageField(upload_to="uploads/")
    name       = models.CharField(max_length=255, blank=True)
    width      = models.PositiveIntegerField(default=0, help_text="Image width in pixels")
    height     = models.PositiveIntegerField(default=0, help_text="Image height in pixels")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    # When True the image is hidden from the user's workspace but kept for admin.
    is_archived = models.BooleanField(default=False)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self) -> str:
        return self.name or self.image.name


class Polygon(models.Model):
    """A polygon drawn on one uploaded image."""

    image = models.ForeignKey(
        ImageUpload, on_delete=models.CASCADE, related_name="polygons"
    )
    points = models.JSONField()
    color = models.CharField(max_length=24, default="#38bdf8", blank=True)
    label = models.CharField(max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Polygon {self.pk} on {self.image_id}"
