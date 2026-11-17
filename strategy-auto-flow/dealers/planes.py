"""
LOS PLANES Y SUS FUNCIONES

Este es el único lugar donde se decide qué incluye cada plan.
Si mañana quieres mover una función de un plan a otro, se cambia aquí y nada más.

Cada plan incluye todo lo del plan anterior.
"""

# Cada función: código interno -> (nombre que se ve en pantalla, fase en que se construye)
FUNCIONES = {
    # --- Básico ---
    "inventario": ("Inventario de carros (uno a uno o con Excel/CSV)", "1B"),
    "descripciones_ia": ("Descripciones con IA en español e inglés", "1C"),
    "publicar_meta": ("Publicar en Facebook e Instagram", "1D"),
    "borrar_al_vender": ("Borrar la publicación al marcar vendido", "1D"),
    # --- Profesional ---
    "videos": ("Videos verticales 9:16 para Reels", "3"),
    "agente_mensajes": ("Agente de IA en Messenger e Instagram 24/7", "4"),
    "citas": ("Citas para pruebas de manejo", "4"),
    "pase_a_humano": ("Pasar la conversación a una persona del dealer", "4"),
    # --- Premium ---
    "whatsapp": ("WhatsApp Business", "5"),
    "seguimientos": ("Seguimiento automático (2, 7 y 30 días) y recordatorio de citas", "5"),
    "youtube_tiktok": ("Publicar en YouTube Shorts y TikTok", "6"),
    "alertas_inventario": ("Alertas de carros con 30, 60 y 90 días sin venderse", "7"),
    "informe_mensual": ("Informe mensual de resultados", "7"),
}

# Fases que ya están construidas. Al terminar cada fase, se añade aquí.
FASES_LISTAS = {"1A"}

BASICO = "basico"
PROFESIONAL = "profesional"
PREMIUM = "premium"

_BASICO = ["inventario", "descripciones_ia", "publicar_meta", "borrar_al_vender"]
_PROFESIONAL = _BASICO + ["videos", "agente_mensajes", "citas", "pase_a_humano"]
_PREMIUM = _PROFESIONAL + [
    "whatsapp",
    "seguimientos",
    "youtube_tiktok",
    "alertas_inventario",
    "informe_mensual",
]

PLANES = {
    BASICO: {"nombre": "Básico", "precio": 500, "funciones": frozenset(_BASICO)},
    PROFESIONAL: {"nombre": "Profesional", "precio": 900, "funciones": frozenset(_PROFESIONAL)},
    PREMIUM: {"nombre": "Premium", "precio": 1500, "funciones": frozenset(_PREMIUM)},
}

PLAN_CHOICES = [(codigo, f"{p['nombre']} (${p['precio']:,}/mes)") for codigo, p in PLANES.items()]


def funciones_del_plan(plan: str) -> frozenset:
    """Devuelve las funciones de un plan. Si el plan no existe, ninguna."""
    return PLANES.get(plan, {}).get("funciones", frozenset())


def funcion_construida(codigo: str) -> bool:
    """¿Ya se construyó esta función? (Si no, se muestra como 'Próximamente')."""
    return FUNCIONES[codigo][1] in FASES_LISTAS
