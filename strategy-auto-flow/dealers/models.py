"""Cómo se guarda cada dealer en la base de datos."""
from django.conf import settings
from django.db import models
from django.urls import reverse
from django.utils import timezone

from . import planes


class Dealer(models.Model):
    # Modo de servicio (depende del contrato con el dealer)
    GESTIONADO = "gestionado"
    AUTOSERVICIO = "autoservicio"
    MODO_CHOICES = [
        (GESTIONADO, "Gestionado: solo Strategy Auto Flow aprueba y publica"),
        (AUTOSERVICIO, "Autoservicio: el dealer también aprueba y publica"),
    ]

    # Estado de pago (en la Fase 2 lo actualizará Stripe automáticamente)
    PRUEBA = "prueba"
    ACTIVO = "activo"
    PAUSADO = "pausado"
    ATRASADO = "atrasado"
    CANCELADO = "cancelado"
    ESTADO_CHOICES = [
        (PRUEBA, "En prueba gratis"),
        (ACTIVO, "Activo (al día)"),
        (PAUSADO, "Pausado"),
        (ATRASADO, "Pago atrasado"),
        (CANCELADO, "Cancelado"),
    ]

    nombre = models.CharField("nombre del dealer", max_length=150)
    contacto = models.CharField("persona de contacto", max_length=150, blank=True)
    email = models.EmailField("correo", blank=True)
    telefono = models.CharField("teléfono", max_length=30, blank=True)
    direccion = models.CharField("dirección", max_length=255, blank=True)
    ciudad = models.CharField(max_length=100, blank=True)
    estado_region = models.CharField(
        "estado / territorio", max_length=50, default="Puerto Rico",
        help_text="Importante para las leyes de mensajes (TCPA y leyes estatales).",
    )
    zona_horaria = models.CharField(max_length=50, default="America/Puerto_Rico")
    logo = models.ImageField(upload_to="logos/", blank=True)

    plan = models.CharField(max_length=20, choices=planes.PLAN_CHOICES, default=planes.BASICO)
    modo = models.CharField("modo de servicio", max_length=20, choices=MODO_CHOICES, default=GESTIONADO)
    estado_pago = models.CharField("estado de pago", max_length=20, choices=ESTADO_CHOICES, default=PRUEBA)
    prueba_termina = models.DateField("la prueba gratis termina", null=True, blank=True)
    notas = models.TextField("notas internas (solo las ves tú)", blank=True)

    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre

    def get_absolute_url(self):
        return reverse("dealer_detalle", args=[self.pk])

    @property
    def modo_corto(self):
        return "Gestionado" if self.modo == self.GESTIONADO else "Autoservicio"

    @property
    def direccion_completa(self):
        return ", ".join(p for p in [self.direccion, self.ciudad] if p)

    # --- Plan y funciones ---------------------------------------------------------
    @property
    def plan_nombre(self):
        return planes.PLANES[self.plan]["nombre"]

    @property
    def precio_mensual(self):
        return planes.PLANES[self.plan]["precio"]

    @property
    def servicio_activo(self) -> bool:
        """¿Está al día? Si está en pausa, atrasado o cancelado, lo automático se detiene."""
        if self.estado_pago == self.ACTIVO:
            return True
        if self.estado_pago == self.PRUEBA:
            return self.prueba_termina is None or self.prueba_termina >= timezone.localdate()
        return False

    def incluye(self, funcion: str) -> bool:
        """¿El plan de este dealer incluye la función? (sin mirar el pago)"""
        return funcion in planes.funciones_del_plan(self.plan)

    def tiene(self, funcion: str) -> bool:
        """
        LA REGLA PRINCIPAL: ¿este dealer puede usar esta función ahora mismo?
        Tiene que estar en su plan Y el servicio tiene que estar activo.
        Toda la app pregunta aquí antes de hacer algo.
        """
        return self.incluye(funcion) and self.servicio_activo

    def estado_funciones(self):
        """Lista para mostrar en pantalla cómo está cada función para este dealer."""
        filas = []
        for codigo, (nombre, fase) in planes.FUNCIONES.items():
            if not self.incluye(codigo):
                estado = "no_incluida"
            elif not self.servicio_activo:
                estado = "bloqueada"
            elif not planes.funcion_construida(codigo):
                estado = "proximamente"
            else:
                estado = "activa"
            filas.append({"codigo": codigo, "nombre": nombre, "fase": fase, "estado": estado})
        return filas

    def puede_aprobar(self, usuario) -> bool:
        """¿Esta persona puede pulsar 'Aprobar y publicar' para este dealer?"""
        if usuario.es_admin:
            return True
        return self.modo == self.AUTOSERVICIO and usuario.dealer_id == self.pk


class CambioDealer(models.Model):
    """Historial: quién cambió el plan, el modo o el estado de pago y cuándo."""

    dealer = models.ForeignKey(Dealer, on_delete=models.CASCADE, related_name="cambios")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    campo = models.CharField(max_length=30)
    antes = models.CharField(max_length=50)
    despues = models.CharField(max_length=50)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha"]

    NOMBRES_CAMPO = {"plan": "Plan", "modo": "Modo", "estado_pago": "Estado de pago"}

    def _legible(self, valor):
        """Convierte el código guardado ('premium') en el nombre que se ve ('Premium')."""
        if self.campo == "plan":
            return planes.PLANES.get(valor, {}).get("nombre", valor)
        opciones = {"modo": Dealer.MODO_CHOICES, "estado_pago": Dealer.ESTADO_CHOICES}.get(self.campo, [])
        return dict(opciones).get(valor, valor).split(":")[0]

    @property
    def nombre_campo(self):
        return self.NOMBRES_CAMPO.get(self.campo, self.campo)

    @property
    def antes_legible(self):
        return self._legible(self.antes)

    @property
    def despues_legible(self):
        return self._legible(self.despues)

    def __str__(self):
        return f"{self.dealer}: {self.nombre_campo} {self.antes_legible} → {self.despues_legible}"
