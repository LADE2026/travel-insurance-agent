"""
Pruebas automáticas. Revisan solas que las reglas importantes se cumplan.
Se corren con:  python manage.py test
"""
from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from cuentas.models import Usuario

from . import planes
from .models import CambioDealer, Dealer
from .permisos import dealers_visibles


class Base(TestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_superuser(email="admin@saf.test", password="clave-segura-123")
        self.dealer_a = Dealer.objects.create(nombre="Autos A", plan=planes.BASICO, estado_pago=Dealer.ACTIVO)
        self.dealer_b = Dealer.objects.create(nombre="Autos B", plan=planes.PREMIUM, estado_pago=Dealer.ACTIVO)
        self.empleado_a = Usuario.objects.create_user(
            email="ana@autosa.test", password="clave-segura-123", rol=Usuario.DEALER, dealer=self.dealer_a
        )


class PlanesTest(Base):
    def test_basico_tiene_solo_lo_basico(self):
        self.assertTrue(self.dealer_a.tiene("descripciones_ia"))
        self.assertTrue(self.dealer_a.tiene("publicar_meta"))
        self.assertFalse(self.dealer_a.tiene("videos"))
        self.assertFalse(self.dealer_a.tiene("whatsapp"))

    def test_cada_plan_incluye_el_anterior(self):
        b = planes.funciones_del_plan(planes.BASICO)
        p = planes.funciones_del_plan(planes.PROFESIONAL)
        pr = planes.funciones_del_plan(planes.PREMIUM)
        self.assertTrue(b < p < pr)
        self.assertEqual(pr, frozenset(planes.FUNCIONES))

    def test_subir_de_plan_cambia_las_funciones(self):
        self.dealer_a.plan = planes.PROFESIONAL
        self.dealer_a.save()
        self.dealer_a.refresh_from_db()
        self.assertTrue(self.dealer_a.tiene("videos"))
        self.assertFalse(self.dealer_a.tiene("youtube_tiktok"))

    def test_pausado_o_atrasado_detiene_todo(self):
        for estado in (Dealer.PAUSADO, Dealer.ATRASADO, Dealer.CANCELADO):
            self.dealer_b.estado_pago = estado
            self.assertFalse(self.dealer_b.tiene("inventario"), estado)

    def test_prueba_vencida_detiene_todo(self):
        self.dealer_a.estado_pago = Dealer.PRUEBA
        self.dealer_a.prueba_termina = timezone.localdate() + timedelta(days=5)
        self.assertTrue(self.dealer_a.tiene("inventario"))
        self.dealer_a.prueba_termina = timezone.localdate() - timedelta(days=1)
        self.assertFalse(self.dealer_a.tiene("inventario"))

    def test_quien_puede_aprobar(self):
        self.assertTrue(self.dealer_a.puede_aprobar(self.admin))
        self.assertFalse(self.dealer_a.puede_aprobar(self.empleado_a))  # gestionado
        self.dealer_a.modo = Dealer.AUTOSERVICIO
        self.assertTrue(self.dealer_a.puede_aprobar(self.empleado_a))
        self.assertFalse(self.dealer_b.puede_aprobar(self.empleado_a))  # otro dealer


class SeparacionDeDatosTest(Base):
    """Lo más importante: un dealer NUNCA ve lo de otro."""

    def test_empleado_solo_ve_su_dealer(self):
        self.assertEqual(list(dealers_visibles(self.empleado_a)), [self.dealer_a])

    def test_empleado_no_abre_otro_dealer(self):
        self.client.force_login(self.empleado_a)
        r = self.client.get(reverse("dealer_detalle", args=[self.dealer_b.pk]))
        self.assertEqual(r.status_code, 404)

    def test_empleado_va_directo_a_su_dealer(self):
        self.client.force_login(self.empleado_a)
        r = self.client.get(reverse("panel"))
        self.assertRedirects(r, reverse("dealer_detalle", args=[self.dealer_a.pk]))

    def test_empleado_no_puede_crear_ni_editar_dealers(self):
        self.client.force_login(self.empleado_a)
        self.assertEqual(self.client.get(reverse("dealer_crear")).status_code, 403)
        self.assertEqual(self.client.get(reverse("dealer_editar", args=[self.dealer_a.pk])).status_code, 403)
        r = self.client.post(reverse("dealer_editar", args=[self.dealer_a.pk]), {"plan": planes.PREMIUM})
        self.assertEqual(r.status_code, 403)
        self.dealer_a.refresh_from_db()
        self.assertEqual(self.dealer_a.plan, planes.BASICO)

    def test_admin_ve_todos(self):
        self.client.force_login(self.admin)
        r = self.client.get(reverse("panel"))
        self.assertContains(r, "Autos A")
        self.assertContains(r, "Autos B")

    def test_sin_sesion_va_a_entrar(self):
        r = self.client.get(reverse("dealer_detalle", args=[self.dealer_a.pk]))
        self.assertEqual(r.status_code, 302)
        self.assertIn(reverse("login"), r["Location"])


class PanelAdminTest(Base):
    def setUp(self):
        super().setUp()
        self.client.force_login(self.admin)

    def _datos(self, **cambios):
        datos = {
            "nombre": "Autos A", "estado_region": "Puerto Rico", "zona_horaria": "America/Puerto_Rico",
            "plan": planes.BASICO, "modo": Dealer.GESTIONADO, "estado_pago": Dealer.ACTIVO,
        }
        datos.update(cambios)
        return datos

    def test_crear_dealer(self):
        r = self.client.post(reverse("dealer_crear"), self._datos(nombre="Nuevo Motors"))
        nuevo = Dealer.objects.get(nombre="Nuevo Motors")
        self.assertRedirects(r, nuevo.get_absolute_url())

    def test_cambio_de_plan_queda_en_historial(self):
        self.client.post(reverse("dealer_editar", args=[self.dealer_a.pk]), self._datos(plan=planes.PREMIUM))
        cambio = CambioDealer.objects.get(dealer=self.dealer_a)
        self.assertEqual((cambio.campo, cambio.antes, cambio.despues), ("plan", "basico", "premium"))
        self.assertEqual(cambio.despues_legible, "Premium")
        self.assertEqual(cambio.usuario, self.admin)

    def test_crear_usuario_de_dealer(self):
        self.client.post(reverse("usuario_crear", args=[self.dealer_b.pk]), {
            "first_name": "Luis", "last_name": "Rivera", "email": "Luis@AutosB.test", "password": "otra-clave-larga-9",
        })
        u = Usuario.objects.get(email="luis@autosb.test")
        self.assertEqual((u.rol, u.dealer), (Usuario.DEALER, self.dealer_b))
        self.assertTrue(u.check_password("otra-clave-larga-9"))

    def test_desactivar_usuario(self):
        self.client.post(reverse("usuario_activar", args=[self.dealer_a.pk, self.empleado_a.pk]))
        self.empleado_a.refresh_from_db()
        self.assertFalse(self.empleado_a.is_active)


class PaginasPublicasTest(TestCase):
    def test_paginas_publicas_abren(self):
        for nombre in ("inicio", "privacidad", "terminos", "borrado_datos", "login"):
            self.assertEqual(self.client.get(reverse(nombre)).status_code, 200, nombre)

    def test_inicio_muestra_los_tres_planes(self):
        r = self.client.get(reverse("inicio"))
        for texto in ("Básico", "Profesional", "Premium", "$500", "$900", "$1,500"):
            self.assertContains(r, texto)
