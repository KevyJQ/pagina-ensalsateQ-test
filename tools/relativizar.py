"""Convierte las rutas que empiezan con "/" en rutas relativas.

Por qué: GitHub Pages publica el sitio en una subruta (usuario.github.io/repositorio/),
y una ruta como "/assets/site.css" apuntaría a la raíz de github.io y fallaría.
Con rutas relativas el sitio funciona igual en GitHub Pages y en un dominio propio.

Uso (desde la carpeta del sitio):  python tools/relativizar.py
Es seguro ejecutarlo varias veces: no toca lo que ya es relativo.
"""
import os
import re
import sys

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(here)

SKIP_DIRS = {"tools", ".git", ".github", "node_modules"}
SKIP_FILES = {"404.html"}  # la 404 se sirve en cualquier profundidad; se resuelve sola

attr = re.compile(r'\b(href|src|action)="/(?!/)([^"]*)"')
count = 0
files = 0

for dp, dn, fn in os.walk(root):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for f in fn:
        p = os.path.join(dp, f)
        rel = os.path.relpath(p, root)
        if f.endswith(".html") and f not in SKIP_FILES:
            depth = rel.count(os.sep)
            prefix = "../" * depth

            def sub(m):
                global count
                path = m.group(2)
                new = prefix + path
                if new == "":
                    new = "./"
                count += 1
                return '%s="%s"' % (m.group(1), new)

            s = open(p, encoding="utf-8").read()
            s2 = attr.sub(sub, s)
            if s2 != s:
                open(p, "w", encoding="utf-8", newline="").write(s2)
                files += 1

# CSS: las rutas dentro de site.css son relativas al propio archivo (assets/)
css = os.path.join(root, "assets", "site.css")
if os.path.exists(css):
    s = open(css, encoding="utf-8").read()
    s2 = re.sub(r'url\((["\']?)/assets/', r'url(\1', s)
    s2 = s2.replace('a[href="/curso-online/"]', 'a[href$="curso-online/"]')
    if s2 != s:
        open(css, "w", encoding="utf-8", newline="").write(s2)
        files += 1

print("Rutas convertidas: %d en %d archivos" % (count, files))
