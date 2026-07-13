"""Create the demo user and admin superuser. Safe to run repeatedly."""
import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

DEMO_EMAIL    = os.getenv("DEMO_EMAIL",    "demo@example.com")
DEMO_USERNAME = os.getenv("DEMO_USERNAME", "demo")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "demo1234")

ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL",    "admin@example.com")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin1234")


class Command(BaseCommand):
    help = "Create or reset the demo user and admin superuser."

    def handle(self, *args, **options):
        # ── Demo user (regular) ────────────────────────────────────────────────
        user, created = User.objects.get_or_create(
            username=DEMO_USERNAME,
            defaults={"email": DEMO_EMAIL},
        )
        user.email = DEMO_EMAIL
        user.set_password(DEMO_PASSWORD)
        user.is_staff = False
        user.is_superuser = False
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{action} demo user:  {DEMO_EMAIL} / {DEMO_PASSWORD}")
        )

        # ── Admin superuser ────────────────────────────────────────────────────
        admin, admin_created = User.objects.get_or_create(
            username=ADMIN_USERNAME,
            defaults={"email": ADMIN_EMAIL},
        )
        admin.email = ADMIN_EMAIL
        admin.set_password(ADMIN_PASSWORD)
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()

        action = "Created" if admin_created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{action} admin user: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        )

        self.stdout.write("")
        self.stdout.write("  Django admin panel → http://127.0.0.1:8000/admin/")
        self.stdout.write(f"  Login with:          {ADMIN_EMAIL} / {ADMIN_PASSWORD}")