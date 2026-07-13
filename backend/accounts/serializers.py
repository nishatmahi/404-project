"""Serializers for authentication."""
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Log in with an email address instead of a username.

    Django's auth backend authenticates on `username`. We accept `email`,
    resolve it to the matching user, authenticate with that user's username,
    then issue the JWT pair ourselves.
    """

    username_field = "email"

    def validate(self, attrs):
        email = (attrs.get("email") or "").strip().lower()
        password = attrs.get("password") or ""

        invalid = serializers.ValidationError(
            {"detail": "No account found with that email and password."}
        )

        user = User.objects.filter(email__iexact=email).order_by("id").first()
        if user is None:
            raise invalid

        # Authenticate against the resolved username.
        user = authenticate(
            request=self.context.get("request"),
            username=user.username,
            password=password,
        )
        if user is None:
            raise invalid
        if not user.is_active:
            raise serializers.ValidationError({"detail": "This account is inactive."})

        refresh = self.get_token(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            },
        }


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_superuser",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name"]

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if not email:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        password = validated_data.pop("password")
        first_name = validated_data.get("first_name", "")
        last_name = validated_data.get("last_name", "")

        user = User(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        user.set_password(password)
        user.save()
        return user