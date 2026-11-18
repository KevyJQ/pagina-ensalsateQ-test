# EnsalsateQ, sitio web

Sitio estático (HTML, CSS y JavaScript, sin instalar nada). Academia de baile en Querétaro.

## Ver el sitio en tu computadora

    python -m http.server 5173

y abre http://localhost:5173/

## Publicar en GitHub Pages (versión de prueba para el gerente)

1. Crea un repositorio nuevo en GitHub (por ejemplo `ensalsateq`), vacío, sin README.
2. Desde esta carpeta, en una terminal:

       git init
       git add .
       git commit -m "Sitio EnsalsateQ"
       git branch -M main
       git remote add origin https://github.com/TU-USUARIO/ensalsateq.git
       git push -u origin main

3. En GitHub: **Settings, Pages, Build and deployment**. En *Source* elige **Deploy from a branch**, rama **main**, carpeta **/ (root)**, y guarda.
4. En uno o dos minutos el sitio queda en `https://TU-USUARIO.github.io/ensalsateq/`. Ese es el enlace para tu gerente.

Para actualizar después: cambia los archivos, y luego `git add .`, `git commit -m "Descripción"` y `git push`.

### Modo de prueba

Esta versión está en **modo staging**: lleva `noindex` en todas las páginas y un `robots.txt` que bloquea a Google, para que la copia de prueba no compita con el dominio real.

## Pasar al hosting con el dominio real

1. Quita el modo de prueba:

       python tools/modo_staging.py off

2. Sube todo el contenido de esta carpeta al hosting.
3. Activa las cabeceras de seguridad (HSTS, CSP y otras):
   - `_headers`: para Netlify, Cloudflare Pages y servicios parecidos (va en la raíz).
   - `nginx-seguridad.conf`: para nginx; pega su contenido dentro del bloque `server { ... }` y recarga nginx.
   - GitHub Pages **no** aplica estos archivos: solo sirven en el hosting real.
4. Si cambiaste algún `<script>` en línea, regenera las cabeceras: `python tools/gen_headers.py`.
5. Comprueba el resultado en https://securityheaders.com

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | Página principal |
| `servicios/`, `clases-grupales/`, `curso-online/`, etc. | Páginas internas (cada una en su carpeta con `index.html`) |
| `assets/` | Fotos, logos, `site.css` y `site.js` |
| `404.html` | Página de error propia (GitHub Pages la usa sola) |
| `.nojekyll` | Evita que GitHub Pages procese el sitio con Jekyll |
| `robots.txt` | Bloquea o permite a los buscadores (según el modo de prueba) |
| `_headers`, `nginx-seguridad.conf` | Cabeceras de seguridad para el hosting real |
| `tools/` | Scripts de Python para mantener el sitio |

## Scripts (`tools/`)

- `relativizar.py`: convierte rutas como `/assets/...` en rutas relativas, para que el sitio funcione en una subruta de GitHub Pages y en un dominio propio. Es seguro ejecutarlo varias veces. Úsalo si pegas páginas nuevas que traigan rutas con `/`.
- `modo_staging.py on|off`: activa o desactiva el modo de prueba.
- `gen_headers.py`: regenera `_headers` y `nginx-seguridad.conf`.

## Notas de seguridad

- Las librerías externas (GSAP y partículas) se cargan con verificación de integridad (SRI). Si cambias su versión, hay que recalcular el hash.
- Los formularios no envían datos a ningún servidor: arman el mensaje y abren WhatsApp.
- Las fuentes vienen de Google Fonts.
