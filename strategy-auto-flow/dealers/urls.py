from django.urls import path

from . import views

urlpatterns = [
    path("", views.panel, name="panel"),
    path("dealers/nuevo/", views.dealer_crear, name="dealer_crear"),
    path("dealers/<int:pk>/", views.dealer_detalle, name="dealer_detalle"),
    path("dealers/<int:pk>/editar/", views.dealer_editar, name="dealer_editar"),
    path("dealers/<int:pk>/usuarios/nuevo/", views.usuario_crear, name="usuario_crear"),
    path(
        "dealers/<int:pk>/usuarios/<int:usuario_id>/activar/",
        views.usuario_activar,
        name="usuario_activar",
    ),
]
