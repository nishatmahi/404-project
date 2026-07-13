"""Task and Tag models for the Kanban board."""
from django.contrib.auth.models import User
from django.db import models


class Tag(models.Model):
    """A reusable label a user can attach to tasks."""

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tags")
    name = models.CharField(max_length=40)

    class Meta:
        # A user cannot have two tags with the same name.
        unique_together = ("owner", "name")
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Task(models.Model):
    """A single card on the Kanban board, belonging to one calendar day."""

    class Status(models.TextChoices):
        TODO = "todo", "To Do"
        IN_PROGRESS = "in_progress", "In Progress"
        DONE = "done", "Done"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.TODO
    )
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM
    )

    # The board day this task appears under. Drives per-date filtering.
    task_date = models.DateField()
    # Optional deadline, may differ from the board day.
    due_date = models.DateField(null=True, blank=True)

    tags = models.ManyToManyField(Tag, blank=True, related_name="tasks")

    # Position within its column, for stable drag-and-drop ordering.
    order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "created_at"]
        indexes = [models.Index(fields=["owner", "task_date"])]

    def __str__(self) -> str:
        return f"{self.title} ({self.task_date})"