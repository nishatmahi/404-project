"""Serializers for image uploads and polygon annotations."""
from rest_framework import serializers

from .models import ImageUpload, Polygon


class PolygonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Polygon
        fields = ["id", "image", "points", "color", "label", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_image(self, image: ImageUpload) -> ImageUpload:
        if image.owner != self.context["request"].user:
            raise serializers.ValidationError("You cannot annotate this image.")
        return image

    def validate_points(self, points):
        if not isinstance(points, list) or len(points) < 3:
            raise serializers.ValidationError(
                "A polygon needs at least three points."
            )

        for index, point in enumerate(points):
            if not isinstance(point, dict):
                raise serializers.ValidationError(
                    f"Point {index + 1} must be an object with x and y values."
                )

            x = point.get("x")
            y = point.get("y")
            if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
                raise serializers.ValidationError(
                    f"Point {index + 1} must include numeric x and y values."
                )
            if not (0 <= x <= 1) or not (0 <= y <= 1):
                raise serializers.ValidationError(
                    f"Point {index + 1}: x and y must be in the range [0, 1] (normalized coordinates)."
                )

        return points


class ImageUploadSerializer(serializers.ModelSerializer):
    polygons = PolygonSerializer(many=True, read_only=True)

    class Meta:
        model = ImageUpload
        fields = ["id", "image", "name", "width", "height", "uploaded_at", "polygons"]
        read_only_fields = ["id", "width", "height", "uploaded_at", "polygons"]

    def to_representation(self, instance):
        """Return absolute URL for image and all polygon data."""
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and data.get("image"):
            if not data["image"].startswith("http"):
                data["image"] = request.build_absolute_uri(data["image"])
        return data

    def create(self, validated_data):
        image_file = validated_data.get("image")
        if image_file and not validated_data.get("name"):
            validated_data["name"] = image_file.name
        # owner is injected by the view via serializer.save(owner=request.user)
        return ImageUpload.objects.create(**validated_data)
