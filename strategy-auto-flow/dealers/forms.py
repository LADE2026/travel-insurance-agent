"""Formularios del panel: añadir y editar dealers, y añadir usuarios a un dealer."""
from django import forms
from django.contrib.auth import password_validation

from cuentas.models import Usuario

from .models import Dealer


class DealerForm(forms.ModelForm):
    class Meta:
        model = Dealer
        fields = [
            "nombre", "contacto", "email", "telefono", "direccion", "ciudad",
            "estado_region", "zona_horaria", "logo",
            "plan", "modo", "estado_pago", "prueba_termina", "notas",
        ]
        widgets = {
            "prueba_termina": forms.DateInput(attrs={"type": "date"}, format="%Y-%m-%d"),
            "notas": forms.Textarea(attrs={"rows": 3}),
        }


class UsuarioDealerForm(forms.ModelForm):
    """Crea la cuenta de un empleado del dealer con una contraseña temporal."""

    password = forms.CharField(
        label="contraseña temporal",
        widget=forms.PasswordInput,
        help_text="Mínimo 10 caracteres. Pídele a la persona que la cambie al entrar.",
    )

    class Meta:
        model = Usuario
        fields = ["first_name", "last_name", "email"]
        labels = {"first_name": "nombre", "last_name": "apellidos"}

    def clean_email(self):
        email = self.cleaned_data["email"].lower()
        if Usuario.objects.filter(email=email).exists():
            raise forms.ValidationError("Ya existe una cuenta con ese correo.")
        return email

    def clean_password(self):
        password = self.cleaned_data["password"]
        password_validation.validate_password(password)
        return password
