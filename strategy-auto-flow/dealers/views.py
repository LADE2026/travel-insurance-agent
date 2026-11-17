"""Las pantallas del panel privado."""
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, redirect, render

from cuentas.models import Usuario

from . import planes
from .forms import DealerForm, UsuarioDealerForm
from .models import CambioDealer, Dealer
from .permisos import dealers_visibles, obtener_dealer, solo_admin

CAMPOS_VIGILADOS = ["plan", "modo", "estado_pago"]


@login_required
def panel(request):
    """Página principal del panel. Tú ves todos los dealers; un dealer va directo a lo suyo."""
    if not request.user.es_admin:
        if request.user.dealer_id:
            return redirect("dealer_detalle", pk=request.user.dealer_id)
        return render(request, "panel/sin_dealer.html")

    dealers = dealers_visibles(request.user).annotate(num_usuarios=Count("usuarios"))

    # Filtros de la lista
    filtro_plan = request.GET.get("plan", "")
    filtro_estado = request.GET.get("estado", "")
    buscar = request.GET.get("q", "").strip()
    if filtro_plan:
        dealers = dealers.filter(plan=filtro_plan)
    if filtro_estado:
        dealers = dealers.filter(estado_pago=filtro_estado)
    if buscar:
        dealers = dealers.filter(Q(nombre__icontains=buscar) | Q(ciudad__icontains=buscar))

    todos = list(dealers_visibles(request.user))
    activos = [d for d in todos if d.estado_pago == Dealer.ACTIVO]
    resumen = {
        "total": len(todos),
        "activos": len(activos),
        "en_prueba": sum(1 for d in todos if d.estado_pago == Dealer.PRUEBA),
        "con_problema": sum(1 for d in todos if d.estado_pago in (Dealer.ATRASADO, Dealer.PAUSADO)),
        "ingreso_mensual": sum(d.precio_mensual for d in activos),
        "por_plan": [
            {"nombre": p["nombre"], "cantidad": sum(1 for d in todos if d.plan == codigo)}
            for codigo, p in planes.PLANES.items()
        ],
    }
    return render(request, "panel/inicio_admin.html", {
        "dealers": dealers,
        "resumen": resumen,
        "planes": planes.PLAN_CHOICES,
        "estados": Dealer.ESTADO_CHOICES,
        "filtro_plan": filtro_plan,
        "filtro_estado": filtro_estado,
        "buscar": buscar,
    })


@login_required
def dealer_detalle(request, pk):
    dealer = obtener_dealer(request.user, pk)  # 404 si no es suyo
    contexto = {
        "dealer": dealer,
        "funciones": dealer.estado_funciones(),
        "puede_aprobar": dealer.puede_aprobar(request.user),
        "usuarios": dealer.usuarios.order_by("first_name", "email"),
    }
    if request.user.es_admin:
        contexto["cambios"] = dealer.cambios.select_related("usuario")[:10]
    return render(request, "panel/dealer_detalle.html", contexto)


@solo_admin
def dealer_crear(request):
    form = DealerForm(request.POST or None, request.FILES or None)
    if form.is_valid():
        dealer = form.save()
        messages.success(request, f"Dealer «{dealer.nombre}» creado.")
        return redirect(dealer)
    return render(request, "panel/dealer_form.html", {"form": form, "titulo": "Añadir dealer"})


@solo_admin
def dealer_editar(request, pk):
    dealer = get_object_or_404(Dealer, pk=pk)
    antes = {campo: getattr(dealer, campo) for campo in CAMPOS_VIGILADOS}
    form = DealerForm(request.POST or None, request.FILES or None, instance=dealer)
    if form.is_valid():
        with transaction.atomic():
            dealer = form.save()
            # Guarda en el historial cada cambio de plan, modo o estado de pago.
            for campo in CAMPOS_VIGILADOS:
                despues = getattr(dealer, campo)
                if antes[campo] != despues:
                    CambioDealer.objects.create(
                        dealer=dealer, usuario=request.user, campo=campo,
                        antes=antes[campo], despues=despues,
                    )
        messages.success(request, "Cambios guardados. Las funciones del dealer ya se actualizaron.")
        return redirect(dealer)
    return render(request, "panel/dealer_form.html", {
        "form": form, "titulo": f"Editar {dealer.nombre}", "dealer": dealer,
    })


@solo_admin
def usuario_crear(request, pk):
    dealer = get_object_or_404(Dealer, pk=pk)
    nuevo = Usuario(rol=Usuario.DEALER, dealer=dealer)  # siempre ligado a ESTE dealer
    form = UsuarioDealerForm(request.POST or None, instance=nuevo)
    if form.is_valid():
        usuario = form.save(commit=False)
        usuario.set_password(form.cleaned_data["password"])
        usuario.save()
        messages.success(request, f"Cuenta creada para {usuario.email}.")
        return redirect(dealer)
    return render(request, "panel/usuario_form.html", {"form": form, "dealer": dealer})


@solo_admin
def usuario_activar(request, pk, usuario_id):
    """Desactiva o vuelve a activar la cuenta de un empleado (sin borrarla)."""
    dealer = get_object_or_404(Dealer, pk=pk)
    usuario = get_object_or_404(Usuario, pk=usuario_id, dealer=dealer)
    if request.method == "POST":
        usuario.is_active = not usuario.is_active
        usuario.save(update_fields=["is_active"])
        estado = "activada" if usuario.is_active else "desactivada"
        messages.success(request, f"Cuenta de {usuario.email} {estado}.")
    return redirect(dealer)
