"""Root URL configuration."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

# ── Admin panel branding ───────────────────────────────────────────────────────
admin.site.site_header = "Administration"
admin.site.site_title  = "Administration"
admin.site.index_title = "Dashboard"


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("tasks.urls")),
    path("api/", include("annotations.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
