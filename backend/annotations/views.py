"""Image upload and polygon annotation API viewsets."""
from PIL import Image
from rest_framework import decorators, parsers, response, viewsets

from .models import ImageUpload, Polygon
from .serializers import ImageUploadSerializer, PolygonSerializer


class ImageUploadViewSet(viewsets.ModelViewSet):
    """Upload and list the current user's active (non-archived) images."""

    serializer_class = ImageUploadSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        # Users only see their non-archived images; admins see everything.
        return (
            ImageUpload.objects.filter(owner=self.request.user, is_archived=False)
            .prefetch_related("polygons")
        )

    def perform_create(self, serializer):
        """Save the new image and populate its dimensions."""
        image_obj = serializer.save(owner=self.request.user)

        # Populate width/height from Pillow.
        if image_obj.image:
            try:
                img = Image.open(image_obj.image.file)
                image_obj.width = img.width
                image_obj.height = img.height
                image_obj.save(update_fields=["width", "height"])
            except Exception:
                pass

    @decorators.action(detail=True, methods=["get"])
    def polygons(self, request, pk=None):
        image = self.get_object()
        serializer = PolygonSerializer(
            image.polygons.all(), many=True, context={"request": request}
        )
        return response.Response(serializer.data)

    @decorators.action(detail=False, methods=["get"])
    def archived(self, request):
        """Return the current user's archived (previous session) images."""
        qs = (
            ImageUpload.objects.filter(owner=request.user, is_archived=True)
            .prefetch_related("polygons")
            .order_by("-uploaded_at")
        )
        serializer = ImageUploadSerializer(qs, many=True, context={"request": request})
        return response.Response(serializer.data)


class PolygonViewSet(viewsets.ModelViewSet):
    """Create, list, update, and delete polygons for the current user's images."""

    serializer_class = PolygonSerializer

    def get_queryset(self):
        return Polygon.objects.filter(image__owner=self.request.user).select_related(
            "image"
        )
