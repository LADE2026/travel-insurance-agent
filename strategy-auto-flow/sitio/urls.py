from django.urls import path

from . import views

urlpatterns = [
    path("", views.inicio, name="inicio"),
    path("privacidad/", views.privacidad, name="privacidad"),
    path("terminos/", views.terminos, name="terminos"),
    path("borrado-de-datos/", views.borrado_datos, name="borrado_datos"),
]
