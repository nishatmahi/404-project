"""Serializers for tasks and tags."""
from rest_framework import serializers

from .models import Tag, Task


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class TaskSerializer(serializers.ModelSerializer):
    """Handles tags as plain strings on both read and write.

    The client always sends/receives {"tags": ["work", "urgent"]}.
    On write we pop the list and sync Tag rows; on read we emit names.
    """

    # Declared as a plain read-only method field so DRF never touches
    # the M2M manager directly.
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "status",
            "priority",
            "task_date",
            "due_date",
            "tags",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_tags(self, obj: Task) -> list[str]:
        return [tag.name for tag in obj.tags.all()]

    def validate_title(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title cannot be empty.")
        return value

    def _sync_tags(self, task: Task, names: list[str]) -> None:
        """Resolve tag name strings to Tag rows owned by this user."""
        owner = task.owner
        tag_objects = []
        for raw in names:
            name = raw.strip()
            if not name:
                continue
            tag, _ = Tag.objects.get_or_create(owner=owner, name=name)
            tag_objects.append(tag)
        task.tags.set(tag_objects)

    def to_internal_value(self, data):
        """Extract the raw 'tags' list before DRF processes fields."""
        # Pull tags out before super() runs so DRF doesn't choke on them
        tags = data.get("tags", [])
        if not isinstance(tags, list):
            tags = []
        # Validate each tag is a non-empty string
        clean_tags = []
        for t in tags:
            if not isinstance(t, str):
                raise serializers.ValidationError({"tags": "Each tag must be a string."})
            clean_tags.append(t.strip())

        internal = super().to_internal_value(data)
        internal["_tags"] = clean_tags
        return internal

    def create(self, validated_data):
        tag_names = validated_data.pop("_tags", [])
        # 'owner' is injected by the view via serializer.save(owner=request.user)
        task = Task.objects.create(**validated_data)
        self._sync_tags(task, tag_names)
        return task

    def update(self, instance, validated_data):
        tag_names = validated_data.pop("_tags", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if tag_names is not None:
            self._sync_tags(instance, tag_names)
        return instance