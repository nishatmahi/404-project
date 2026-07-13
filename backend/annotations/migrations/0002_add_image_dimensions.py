# Generated migration to add width and height fields to ImageUpload

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("annotations", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="imageupload",
            name="width",
            field=models.PositiveIntegerField(default=0, help_text="Image width in pixels"),
        ),
        migrations.AddField(
            model_name="imageupload",
            name="height",
            field=models.PositiveIntegerField(default=0, help_text="Image height in pixels"),
        ),
    ]
