"""
REGLAS DE ACCESO: quién puede ver qué.

Regla de oro: NUNCA se busca un dealer directamente en la base de datos desde una
pantalla. Siempre se usa `dealers_visibles(usuario)` o `obtener_dealer(...)`.
Así es imposible que un dealer vea los datos de otro por error.
"""
from functools import wraps

from django.core.exceptions import PermissionDenied
from django.http import Http404

from .models import Dealer


def dealers_visibles(usuario):
    """Los dealers que esta persona puede ver."""
    if not usuario.is_authenticated:
        return Dealer.objects.none()
    if usuario.es_admin:
        return Dealer.objects.all()
    if usuario.dealer_id:
        return Dealer.objects.filter(pk=usuario.dealer_id)
    return Dealer.objects.none()


def obtener_dealer(usuario, pk):
    """Busca un dealer SOLO entre los que la persona puede ver. Si no, 'no existe' (404)."""
    try:
        return dealers_visibles(usuario).get(pk=pk)
    except Dealer.DoesNotExist:
        raise Http404("Dealer no encontrado")


def solo_admin(vista):
    """Protege una pantalla para que solo tú (administrador) puedas abrirla."""

    @wraps(vista)
    def envoltura(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.es_admin:
            raise PermissionDenied
        return vista(request, *args, **kwargs)

    return envoltura


def requiere_funcion(funcion):
    """
    Protege una pantalla de un dealer para que solo se abra si su plan incluye
    la función y su servicio está activo. La pantalla debe recibir `dealer_id`.
    Se usará desde la Fase 1B en adelante, por ejemplo: @requiere_funcion("inventario")
    """

    def decorador(vista):
        @wraps(vista)
        def envoltura(request, dealer_id, *args, **kwargs):
            dealer = obtener_dealer(request.user, dealer_id)
            if not dealer.tiene(funcion):
                raise PermissionDenied("Esta función no está incluida en el plan o el servicio está en pausa.")
            return vista(request, dealer, *args, **kwargs)

        return envoltura

    return decorador
