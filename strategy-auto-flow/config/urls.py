"""Direcciones (URLs) de la app: qué página se abre en cada dirección."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path

urlpatterns = [
    path("", include("sitio.urls")),  # página pública
    path("panel/", include("dealers.urls")),  # panel privado
    path("entrar/", auth_views.LoginView.as_view(), name="login"),
    path("salir/", auth_views.LogoutView.as_view(), name="logout"),
    path(
        "cambiar-clave/",
        auth_views.PasswordChangeView.as_view(success_url="/panel/"),
        name="password_change",
    ),
    # Panel técnico de Django (solo para ti, para emergencias).
    path("sistema/", admin.site.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
