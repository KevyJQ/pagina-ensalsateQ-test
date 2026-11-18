"""Genera los archivos de cabeceras de seguridad del sitio.

Uso:  python tools/gen_headers.py [carpeta_publicar]

Lee las páginas de la carpeta de publicación, calcula el hash de los scripts
en línea (la política CSP solo los permite si coinciden) y escribe:
  _headers             -> Netlify, Cloudflare Pages y similares
  nginx-seguridad.conf -> para incluir dentro del bloque `server` de nginx

Vuelve a ejecutarlo cada vez que cambies un <script> en línea de alguna página.
"""
import base64
import hashlib
import os
import re
import sys

root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
root = os.path.abspath(root)

# 1) Hashes de los scripts en línea (los de tipo ld+json no se ejecutan)
hashes = set()
for dp, _, fn in os.walk(root):
    for f in fn:
        if not f.endswith(".html"):
            continue
        s = open(os.path.join(dp, f), encoding="utf-8").read()
        for m in re.finditer(r'<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>', s, re.S):
            if "application/ld+json" in m.group(1):
                continue
            digest = hashlib.sha256(m.group(2).encode("utf-8")).digest()
            hashes.add("'sha256-%s'" % base64.b64encode(digest).decode())

script_src = "'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net " + " ".join(sorted(hashes))

csp = "; ".join([
    "default-src 'self'",
    "script-src " + script_src.strip(),
    "style-src-elem 'self' https://fonts.googleapis.com",
    "style-src-attr 'unsafe-inline'",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
])

headers = [
    ("Strict-Transport-Security", "max-age=31536000; includeSubDomains"),
    ("Content-Security-Policy", csp),
    ("X-Content-Type-Options", "nosniff"),
    ("X-Frame-Options", "SAMEORIGIN"),
    ("Referrer-Policy", "strict-origin-when-cross-origin"),
    ("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"),
    ("Cross-Origin-Opener-Policy", "same-origin"),
]

# 2) _headers (Netlify / Cloudflare Pages)
with open(os.path.join(root, "_headers"), "w", encoding="utf-8", newline="\n") as fh:
    fh.write("# Cabeceras de seguridad. Generado por tools/gen_headers.py\n/*\n")
    for k, v in headers:
        fh.write("  %s: %s\n" % (k, v))

# 3) nginx
with open(os.path.join(root, "nginx-seguridad.conf"), "w", encoding="utf-8", newline="\n") as fh:
    fh.write("# Cabeceras de seguridad. Generado por tools/gen_headers.py\n")
    fh.write("# Pégalo dentro del bloque `server { ... }` del sitio (con HTTPS activo) y recarga nginx.\n")
    for k, v in headers:
        fh.write('add_header %s "%s" always;\n' % (k, v.replace('"', '\\"')))

print("Scripts en línea permitidos por hash:", len(hashes))
print("Escrito:", os.path.join(root, "_headers"))
print("Escrito:", os.path.join(root, "nginx-seguridad.conf"))
