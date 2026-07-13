"""Create the Django admin/staff user.

Safe to run repeatedly.
"""
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

ADMIN_EMAIL = "admin@example.com"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin1234"


class Command(BaseCommand):
    help = "Create or reset the Django admin user."

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            username=ADMIN_USERNAME,
            defaults={"email": ADMIN_EMAIL},
        )
        user.email = ADMIN_EMAIL
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(ADMIN_PASSWORD)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{action} admin user: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        )
