# Google Search Console y Analytics: puesta en marcha

Guía para el propietario de ejhprive.com. Estado al 25/11/2026: propiedad verificada, sitemap enviado (estado Correcto, 29 páginas), 8 páginas en la cola de rastreo prioritaria y Analytics activo en producción.

## 1. Registrar la propiedad

1. Entrar a <https://search.google.com/search-console> con la cuenta de Google del negocio.
2. **Agregar propiedad → Dominio** (no «Prefijo de URL»): cubre `www`, sin `www`, `http`, `https` y los subdominios.
3. Escribir `ejhprive.com`, sin `https://` ni `www`.
4. Google muestra un registro TXT. El que entregó el propietario es:

   ```
   google-site-verification=YcBWjL7PUv3NkNIax_nNCnqxmOlnpmKO1Pjcj7PbQ2k
   ```

   Si Search Console muestra otro valor, vale el de la pantalla: cada cuenta de Google recibe el suyo.

## 2. Agregar el TXT en el DNS

El DNS de ejhprive.com está en **Hostinger** (servidores `atlas.dns-parking.com` y `hyperion.dns-parking.com`), aunque la web esté en Vercel. El registro se agrega en Hostinger:

1. hPanel → **Dominios → ejhprive.com → DNS / Servidores de nombres → Administrar registros DNS**.
2. Agregar un registro nuevo:

   | Campo | Valor |
   |---|---|
   | Tipo | `TXT` |
   | Nombre | `@` |
   | Contenido | `google-site-verification=YcBWjL7PUv3NkNIax_nNCnqxmOlnpmKO1Pjcj7PbQ2k` |
   | TTL | el que venga por defecto |

3. **No tocar** los registros A, CNAME ni NS: son los que apuntan la web a Vercel.
4. No borrar el TXT después de verificar; Google lo vuelve a revisar.

## 3. Comprobar la propagación

```sh
nslookup -type=TXT ejhprive.com 8.8.8.8
```

Tiene que aparecer el texto `google-site-verification=…`. Suele tardar minutos; puede llegar a unas horas. (Agregado y propagado el 25/11/2026.) Cuando aparezca, pulsar **Verificar** en Search Console.

## 4. Enviar el sitemap

**Sitemaps → Agregar un sitemap** → `https://www.ejhprive.com/sitemap.xml`.

- Es el único archivo. Las direcciones anteriores (`sitemap-index.xml`, `sitemap-productos.xml`, `sitemap-0.xml`) redirigen a él; si alguna ya se había enviado, se puede quitar de la lista.
- Se genera en vivo: un producto publicado u oculto en el panel entra o sale solo (hasta 10 minutos de caché).

## 5. Solicitar indexación

**Inspección de URLs** → pegar la dirección completa → **Solicitar indexación**. Hay un límite diario; orden sugerido:

1. `https://www.ejhprive.com/`
2. `https://www.ejhprive.com/productos/`
3. `https://www.ejhprive.com/decants/`
4. `https://www.ejhprive.com/marcas/lattafa/`
5. `https://www.ejhprive.com/productos/khamrah/` y `https://www.ejhprive.com/productos/9-pm/`
6. `https://www.ejhprive.com/perfumes/hombre/` y `https://www.ejhprive.com/perfumes/mujer/`

El resto lo descubre Google por el sitemap y los enlaces internos.

## 6. Inspeccionar una URL

En **Inspección de URLs → Probar URL publicada**, revisar:

- *Indexación permitida*: Sí.
- *URL canónica declarada por el usuario*: con `https://www.`, barra final y sin `?formato=`.
- *Ver página rastreada → Captura*: se ven la foto, el nombre y los precios.
- *Mejoras*: «Fichas de comerciante» / «Fragmentos de producto» y «Rutas de exploración».

Para datos estructurados: <https://search.google.com/test/rich-results> (pegar una ficha) y <https://validator.schema.org>.

## 7. Cobertura e indexación

**Indexación → Páginas**. Estados esperables que **no** son un error:

| Estado | Qué es aquí |
|---|---|
| Página alternativa con etiqueta canónica adecuada | `?formato=3`, `?formato=5`, `?formato=100` de cada ficha |
| Página con redirección | `http://`, sin `www`, sin barra final, sitemaps anteriores, `ejhprive-fragancias.vercel.app` |
| Excluida por una etiqueta «noindex» | `/sistema/`, 404, marcas con una sola fragancia, productos sin ficha |
| Bloqueada por robots.txt | `/admin`, `/gestion`, `/api/`, `/cms-api`, filtros `/productos/?…` |

Sí hay que mirar: *Error del servidor (5xx)* sostenido (panel caído), *No encontrada (404)* en una URL del sitemap, o *Duplicada: Google ha elegido una versión canónica diferente*.

## 8. Resultados de búsqueda

**Rendimiento → Resultados de búsqueda**, filtrado por país *Perú*. Cada dos o cuatro semanas:

- *Páginas* con muchas impresiones y pocos clics: mejorar título o descripción.
- *Consultas* en posiciones 5 a 20: reforzar la página que ya aparece, en lugar de crear otra.
- Comparar con la matriz de palabras clave de [SEO-IMPLEMENTATION-REPORT.md](SEO-IMPLEMENTATION-REPORT.md).

## 9. Google Analytics 4 (contenedor GTM-NWLRTWMC)

El contenedor entregado ya incluye la propiedad GA4 **G-PXVY46YZXN**. No se pegó el script en el HTML: cargaría antes de que el visitante acepte las cookies. Se activa con una variable.

1. Vercel → proyecto de la tienda → **Settings → Environment Variables** (Production):

   ```
   PUBLIC_GTM_ID=GTM-NWLRTWMC
   ```

   Dejar `PUBLIC_GA4_ID` **vacía**: GA4 ya viene dentro del contenedor.
2. **Volver a desplegar** (las variables `PUBLIC_` se incorporan al compilar).
3. Abrir la web, pulsar **Aceptar** en el aviso de cookies y mirar GA4 → **Informes → Tiempo real**.

Eventos que llegan a GA4, en soles (PEN) y con sus productos:

| Evento | Cuándo |
|---|---|
| `page_view` | Cada página, también al navegar sin recarga (lo envía el contenedor) |
| `view_item_list` / `select_item` | Se muestra una lista / se abre una tarjeta |
| `view_item` | Se abre una ficha |
| `add_to_cart` / `remove_from_cart` | Entra o sale una unidad de la bolsa |
| `begin_checkout` | «Continuar» en la bolsa |
| `generate_lead` | Pedido registrado, con su número |
| `contact` | Clic a WhatsApp, Instagram o TikTok |

**`purchase` no se envía a propósito**: la web no cobra; el pago se confirma después en el panel. Contarlo al registrar el pedido inflaría las ventas. Cuando haga falta, se envía desde el panel al pasar a «Confirmado» (Measurement Protocol).

Configuración a revisar en Google:

- **GTM:** no agregar etiquetas de evento de GA4 para los eventos de la tabla; ya llegan y se contarían dos veces.
- **GA4, ya configurado el 25/11/2026:** `generate_lead` es evento clave (sin valor fijo: usa el importe real en soles), la propiedad está vinculada con Search Console y los eventos se conservan 14 meses.
- **Privacidad:** la *recogida de datos proporcionados por los usuarios* (correo, teléfono, dirección) está **sin activar** en GA4. No activarla sin actualizar antes la política de privacidad, que dice «No los compartimos con terceros» (Ley N.º 29733).
- **Catálogo:** los filtros cambian la dirección sin recargar, y el contenedor puede contarlos como páginas vistas. Si molesta: GA4 → Flujo web → Medición mejorada → Páginas vistas → quitar «cambios del historial del navegador» (se dejarían de contar también las navegaciones internas).

## 10. Mantenimiento

| Cuándo | Qué |
|---|---|
| Producto nuevo | Completar en el panel marca, descripción, notas, familia, foto propia y precios. Sin descripción ni notas, la ficha queda en `noindex` |
| Marca con segunda fragancia | Su página `/marcas/…/` pasa a ser indexable sola |
| Cambio de identificador (slug) | Evitarlo; si es inevitable, agregar un 301 en `vercel.json` |
| Producto discontinuado | Ocultarlo: devuelve 404 y sale del sitemap. Agotado temporal: dejarlo visible, se marca «Agotado» |
| Cada mes | Páginas, Rendimiento y Core Web Vitals en Search Console |
