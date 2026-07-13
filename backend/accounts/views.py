"""Authentication views."""
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import EmailTokenObtainPairSerializer, RegisterSerializer, UserSerializer


class EmailTokenObtainPairView(TokenObtainPairView):
    """POST {email, password} -> {access, refresh, user}."""

    permission_classes = [AllowAny]
    serializer_class = EmailTokenObtainPairSerializer


class MeView(APIView):
    """GET the currently authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class RegisterView(APIView):
    """POST {email, password, first_name?, last_name?} to create a new user."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=201)

# Create your views here.
