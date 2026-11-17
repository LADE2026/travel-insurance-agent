# Strategy Auto Flow

Software de mercadeo con inteligencia artificial para dealers de autos en Puerto Rico y Estados Unidos.

**Estado:** Fase 1A terminada (estructura, panel, dealers con planes, usuarios y página pública).

---

## ¿Qué hay en cada carpeta?

| Carpeta / archivo | Qué es |
|---|---|
| `config/` | La configuración general de la app (`settings.py`) y la lista de direcciones (`urls.py`). |
| `cuentas/` | Los usuarios: tú (administrador) y los empleados de cada dealer. |
| `dealers/` | Los dealers, sus planes y el panel. **`dealers/planes.py` es donde se decide qué incluye cada plan.** |
| `dealers/permisos.py` | Las reglas de quién puede ver qué. Aquí se asegura que un dealer nunca vea los datos de otro. |
| `dealers/tests.py` | Pruebas automáticas que revisan esas reglas. |
| `sitio/` | La página pública: inicio, planes, privacidad, términos y borrado de datos. |
| `templates/` | El diseño (HTML) de cada pantalla. |
| `static/` | Colores (`css/saf.css`), logo e íconos. |
| `branding/` | Los logos originales en alta calidad. |
| `.env.example` | La plantilla con todas las claves que vas a necesitar. **Las claves reales van en `.env`, que nunca se sube a GitHub.** |
| `requirements.txt` | Las librerías que la app necesita. |
| `build.sh` y `render.yaml` | Instrucciones para que Render publique la app sola. |

## Cómo funcionan los planes

- Cada dealer tiene un **plan** (Básico, Profesional o Premium), un **modo** (Gestionado o Autoservicio) y un **estado de pago**.
- Antes de hacer algo, la app pregunta `dealer.tiene("nombre_de_la_funcion")`. Responde que sí solo si:
  1. la función está en su plan, **y**
  2. el dealer está activo, o en prueba sin vencer.
- Si cambias el plan, las funciones cambian en el momento. Cada cambio de plan, modo o pago queda en el **historial**.
- **Gestionado:** solo tú puedes pulsar "Aprobar y publicar". **Autoservicio:** el dealer también.

---

## Cómo publicarla en internet (Render)

Necesitas: una cuenta de **GitHub** con este código y una cuenta de **Render** (render.com).

1. Sube esta carpeta a un repositorio de GitHub. Puede ser `strategy-auto-flow`.
2. En Render pulsa **New → Blueprint** y escoge el repositorio. Render lee `render.yaml` y crea solo:
   - la base de datos PostgreSQL (`saf-db`),
   - el servidor de la app (`strategy-auto-flow`),
   - una `SECRET_KEY` al azar.
3. Render te pedirá dos valores. Escríbelos tú:
   - `ADMIN_EMAIL`: tu correo, con el que vas a entrar.
   - `ADMIN_PASSWORD`: una contraseña de **mínimo 10 caracteres**. Después de entrar la primera vez, cámbiala en "Mi contraseña".
4. Espera a que diga **Live**. Abre la dirección que te da Render (algo como `strategy-auto-flow.onrender.com`).

Costo aproximado: servidor *Starter* $7/mes + base de datos ~$6/mes.

## Cómo probar la Fase 1A (lista de cotejo)

- [ ] La página de inicio muestra el logo, los tres planes y los precios.
- [ ] Los enlaces de Privacidad, Términos y Borrado de datos abren.
- [ ] Puedes entrar con tu correo y contraseña.
- [ ] Puedes añadir un dealer, con logo, plan, modo y estado de pago.
- [ ] Al cambiar el plan, cambia la lista de funciones y aparece en el "Historial de cambios".
- [ ] Si pones el estado de pago en "Pausado", sale el aviso rojo y las funciones dicen "Detenida por pago".
- [ ] Puedes añadir un usuario a un dealer.
- [ ] Entrando con ese usuario (en otra ventana privada), **solo ve su dealer** y no puede editar el plan.
- [ ] Todo se ve bien en el celular.

---

## Para programadores (o para Claude en una sesión nueva)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # y pon DEBUG=True y una SECRET_KEY
python manage.py migrate
python manage.py createsuperuser   # tu cuenta de administrador
python manage.py runserver         # abre http://127.0.0.1:8000
python manage.py test              # corre las pruebas
```

Tecnología: Python 3.13, Django 5.2, PostgreSQL, WhiteNoise, Gunicorn, Render.
Próximas fases: 1B inventario (Cloudflare R2), 1C descripciones (API de Claude), 1D Facebook/Instagram (Meta Graph API), 2 Stripe, 3 videos, 4 agente, 5 WhatsApp y seguimientos, 6 YouTube/TikTok, 7 alertas e informes.

**Marca:** oro `#D4AF37`, plata `#C9CED6`, rojo `#E10600`, fondo `#0E0F12`. Títulos en Orbitron.
