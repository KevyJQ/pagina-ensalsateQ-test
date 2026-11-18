"""Activa o desactiva el modo de prueba (staging) del sitio.

En modo de prueba (por ejemplo, GitHub Pages para que tu gerente lo revise) el sitio le
pide a Google que NO lo indexe, para que no compita con el dominio real.

  python tools/modo_staging.py on    -> agrega noindex a todas las páginas y robots.txt con Disallow
  python tools/modo_staging.py off   -> quita noindex y deja robots.txt permitiendo todo

Ejecuta "off" justo antes de publicar en el hosting con el dominio real.
"""
import os
import re
import sys

mode = (sys.argv[1] if len(sys.argv) > 1 else "").lower()
if mode not in ("on", "off"):
    sys.exit("Uso: python tools/modo_staging.py on|off")

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.dirname(here)

TAG = '<meta name="robots" content="noindex, nofollow"><!--staging-->'
pat = re.compile(r'[ \t]*<meta name="robots" content="noindex, nofollow"><!--staging-->\r?\n?')
n = 0
for dp, dn, fn in os.walk(root):
    dn[:] = [d for d in dn if d not in ("tools", ".git", ".github")]
    for f in fn:
        if not f.endswith(".html"):
            continue
        p = os.path.join(dp, f)
        s = open(p, encoding="utf-8").read()
        s = pat.sub("", s)  # siempre limpia primero: es seguro repetir el comando
        if mode == "on":
            s = re.sub(r'(<meta charset="[^"]*">)', r'\1\n  ' + TAG, s, count=1)
        open(p, "w", encoding="utf-8", newline="").write(s)
        n += 1

robots = os.path.join(root, "robots.txt")
with open(robots, "w", encoding="utf-8", newline="\n") as fh:
    if mode == "on":
        fh.write("# Sitio de prueba: no indexar\nUser-agent: *\nDisallow: /\n")
    else:
        fh.write("User-agent: *\nAllow: /\n")

print("Modo staging %s en %d páginas; robots.txt actualizado." % ("ACTIVADO" if mode == "on" else "DESACTIVADO", n))
