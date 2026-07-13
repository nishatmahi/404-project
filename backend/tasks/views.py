"""Task and Tag API viewsets."""
from datetime import date

from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from .models import Tag, Task
from .serializers import TagSerializer, TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD for tasks, scoped to the current user and filterable by date.

    GET /api/tasks/?date=YYYY-MM-DD returns only that day's tasks.
    """

    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = (
            Task.objects.filter(owner=self.request.user)
            .prefetch_related("tags")
        )

        date_param = self.request.query_params.get("date")
        if date_param:
            try:
                parsed = date.fromisoformat(date_param)
            except ValueError:
                raise ValidationError(
                    {"date": "Expected a date in YYYY-MM-DD format."}
                )
            qs = qs.filter(task_date=parsed)

        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TagViewSet(viewsets.ModelViewSet):
    """List and manage the current user's tags."""

    serializer_class = TagSerializer

    def get_queryset(self):
        return Tag.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)