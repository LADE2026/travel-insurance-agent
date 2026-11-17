"""Páginas públicas: inicio, privacidad, términos y borrado de datos (Meta exige las tres últimas)."""
from django.shortcuts import render

from dealers import planes


def inicio(request):
    lista = []
    anteriores = frozenset()
    for codigo, plan in planes.PLANES.items():
        nuevas = [planes.FUNCIONES[f][0] for f in planes.FUNCIONES if f in plan["funciones"] - anteriores]
        lista.append({"codigo": codigo, **plan, "nuevas": nuevas, "hereda": bool(anteriores)})
        anteriores = plan["funciones"]
    return render(request, "sitio/inicio.html", {"planes": lista})


def privacidad(request):
    return render(request, "sitio/privacidad.html")


def terminos(request):
    return render(request, "sitio/terminos.html")


def borrado_datos(request):
    return render(request, "sitio/borrado_datos.html")
