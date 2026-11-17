"""Filtros para mostrar números bonitos en las pantallas."""
from django import template

register = template.Library()


@register.filter
def dinero(valor):
    """1500 -> 1,500"""
    try:
        return f"{int(valor):,}"
    except (TypeError, ValueError):
        return valor
