"""Image annotation routes."""
from rest_framework.routers import DefaultRouter

from .views import ImageUploadViewSet, PolygonViewSet

router = DefaultRouter()
router.register(r"images", ImageUploadViewSet, basename="image")
router.register(r"polygons", PolygonViewSet, basename="polygon")

urlpatterns = router.urls
