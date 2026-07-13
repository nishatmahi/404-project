"""Tests for the image annotation API."""
from tempfile import TemporaryDirectory

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import ImageUpload, Polygon


TINY_GIF = (
    b"GIF87a\x01\x00\x01\x00\x80\x01\x00\x00\x00\x00\xff\xff\xff,"
    b"\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
)


class AnnotationApiTests(TestCase):
    def setUp(self):
        self.media_dir = TemporaryDirectory()
        self.override = override_settings(MEDIA_ROOT=self.media_dir.name)
        self.override.enable()

        self.user = User.objects.create_user(
            username="demo", email="demo@example.com", password="demo1234"
        )
        self.other_user = User.objects.create_user(
            username="other", email="other@example.com", password="demo1234"
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def tearDown(self):
        self.override.disable()
        self.media_dir.cleanup()

    def image_file(self, name="sample.gif"):
        return SimpleUploadedFile(name, TINY_GIF, content_type="image/gif")

    def test_upload_image_defaults_name_and_lists_nested_polygons(self):
        upload_response = self.client.post(
            "/api/images/", {"image": self.image_file()}, format="multipart"
        )

        self.assertEqual(upload_response.status_code, 201)
        self.assertEqual(upload_response.data["name"], "sample.gif")

        image = ImageUpload.objects.get(owner=self.user)
        Polygon.objects.create(
            image=image,
            points=[{"x": 0, "y": 0}, {"x": 1, "y": 0}, {"x": 1, "y": 1}],
        )

        list_response = self.client.get("/api/images/")

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(len(list_response.data[0]["polygons"]), 1)

    def test_cannot_annotate_another_users_image(self):
        other_image = ImageUpload.objects.create(
            owner=self.other_user,
            image=self.image_file("other.gif"),
            name="other.gif",
        )

        response = self.client.post(
            "/api/polygons/",
            {
                "image": other_image.id,
                "points": [{"x": 0, "y": 0}, {"x": 1, "y": 0}, {"x": 1, "y": 1}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Polygon.objects.exists())

    def test_polygon_requires_at_least_three_points(self):
        image = ImageUpload.objects.create(
            owner=self.user,
            image=self.image_file(),
            name="sample.gif",
        )

        response = self.client.post(
            "/api/polygons/",
            {"image": image.id, "points": [{"x": 0, "y": 0}, {"x": 1, "y": 0}]},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("points", response.data)

# Create your tests here.
