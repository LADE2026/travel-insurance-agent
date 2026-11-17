#!/usr/bin/env bash
# Render corre este archivo cada vez que publicas una versión nueva.
set -o errexit
pip install -r requirements.txt
python manage.py collectstatic --no-input   # prepara CSS e imágenes
python manage.py migrate                    # actualiza la base de datos
python manage.py crear_admin_inicial        # crea tu cuenta la primera vez
