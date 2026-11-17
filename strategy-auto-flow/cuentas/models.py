"""
Usuarios de la app.

Hay dos tipos de persona:
- ADMIN: tú (Strategy Auto Flow). Ves y manejas todos los dealers.
- DEALER: un empleado de un dealer. Solo ve los datos de SU dealer.

Se entra con correo electrónico y contraseña.
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.db import models


class UsuarioManager(BaseUserManager):
    use_in_migrations = True

    def _crear(self, email, password, **extra):
        if not email:
            raise ValueError("El correo es obligatorio.")
        usuario = self.model(email=self.normalize_email(email).lower(), **extra)
        usuario.set_password(password)
        usuario.full_clean(exclude=["password"])
        usuario.save(using=self._db)
        return usuario

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._crear(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.update(is_staff=True, is_superuser=True, rol=Usuario.ADMIN)
        return self._crear(email, password, **extra)


class Usuario(AbstractUser):
    ADMIN = "admin"
    DEALER = "dealer"
    ROL_CHOICES = [(ADMIN, "Strategy Auto Flow (administrador)"), (DEALER, "Empleado de dealer")]

    username = None  # no usamos "nombre de usuario", solo el correo
    email = models.EmailField("correo", unique=True)
    rol = models.CharField(max_length=10, choices=ROL_CHOICES, default=DEALER)
    dealer = models.ForeignKey(
        "dealers.Dealer", on_delete=models.CASCADE, null=True, blank=True, related_name="usuarios"
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UsuarioManager()

    class Meta:
        verbose_name = "usuario"

    def __str__(self):
        return self.get_full_name() or self.email

    @property
    def es_admin(self) -> bool:
        return self.rol == self.ADMIN or self.is_superuser

    def clean(self):
        # Un empleado de dealer SIEMPRE tiene que pertenecer a un dealer.
        if self.rol == self.DEALER and not self.dealer_id and not self.is_superuser:
            raise ValidationError({"dealer": "Un usuario de dealer tiene que pertenecer a un dealer."})
        # Un administrador no pertenece a ningún dealer en particular.
        if self.rol == self.ADMIN:
            self.dealer = None
