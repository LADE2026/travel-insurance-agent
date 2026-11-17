"""Datos de la marca disponibles en todas las páginas."""
from django.conf import settings


def marca(request):
    return {
        "EMPRESA_NOMBRE": settings.EMPRESA_NOMBRE,
        "EMPRESA_EMAIL": settings.EMPRESA_EMAIL,
        "EMPRESA_TELEFONO": settings.EMPRESA_TELEFONO,
        "LEGAL_BORRADOR": settings.LEGAL_BORRADOR,
    }
