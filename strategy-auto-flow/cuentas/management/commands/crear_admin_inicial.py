"""
Crea tu cuenta de administrador la primera vez que la app se publica en Render.

Lee ADMIN_EMAIL y ADMIN_PASSWORD de las variables de entorno.
Si la cuenta ya existe, no hace nada (no cambia tu contraseña).
"""
from django.core.management.base import BaseCommand

import environ

from cuentas.models import Usuario


class Command(BaseCommand):
    help = "Crea la cuenta de administrador inicial a partir de ADMIN_EMAIL y ADMIN_PASSWORD."

    def handle(self, *args, **options):
        env = environ.Env()
        email = env("ADMIN_EMAIL", default="").strip().lower()
        password = env("ADMIN_PASSWORD", default="")
        if not email or not password:
            self.stdout.write("ADMIN_EMAIL o ADMIN_PASSWORD no están puestos; no se crea administrador.")
            return
        if Usuario.objects.filter(email=email).exists():
            self.stdout.write("La cuenta de administrador ya existe; no se cambia nada.")
            return
        Usuario.objects.create_superuser(email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Administrador creado: {email}"))
