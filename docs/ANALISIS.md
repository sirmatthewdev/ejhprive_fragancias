# EJH PRIVÉ: análisis de maquetación y semántica

Este documento analiza la landing y las páginas de tienda desde el frontend, en función del negocio: una perfumería árabe de catálogo corto (doce fragancias a noviembre de 2026, editables desde el panel) cuyo diferencial son los **decants de 3 y 5 ml**, con venta asistida por **WhatsApp**.

## 1. Objetivo de la landing

| Pregunta | Respuesta del sitio |
|---|---|
| ¿Qué venden? | Perfumería árabe 100% original (hero: kicker + H1 + bajada) |
| ¿Qué los diferencia? | Elegir entre frasco o decant (primera sección después del hero) |
| ¿Por qué confiar? | Originales, fraccionados del frasco, envío con seguimiento, asesoría personal (bloque de promesa) |
| ¿Qué hago ahora? | CTA principal «Explorar colección», CTA secundario «Descubrir decants», cierre con «Asesoría por WhatsApp» |

## 2. Recorrido de la Home

1. **Hero:** propuesta de valor y dos CTA. El índice tipográfico de las escenas del video lleva a cada perfume.
2. **Elige cómo descubrirlo:** la decisión central del negocio, frasco o decant. Va primero porque segmenta la intención.
3. **La colección:** los productos elegidos en el panel («Productos a mostrar»), o todos los visibles. Cada tarjeta muestra frasco y decant al pasar el mouse.
4. **Decants:** sección en crema que rompe el ritmo oscuro. Explica el proceso y los tamaños, y baja la barrera de entrada.
5. **Por familia olfativa:** índice editorial para quien ya sabe qué le gusta. Al pasar el mouse se ve una vista previa flotante.
6. **Las casas:** prueba de marca (Lattafa, Armaf) y marquee de las cuatro casas.
7. **Promesa y manifiesto:** las cuatro garantías.
8. **FAQ:** responde las objeciones antes de comprar y genera *rich results*.
9. **Síguenos:** una tarjeta por red (Instagram y TikTok, `@perfumeriaejh`). Las redes salen de `SOCIALS` en `src/config/site.ts`: si una red no tiene URL, su tarjeta no aparece, y si no queda ninguna, la sección tampoco.
10. **CTA final por WhatsApp:** cierre conversacional, el canal real de venta.

**Cambio respecto a la versión anterior.** Se quitó la barra de beneficios que estaba justo debajo del hero. Repetía lo que ya dice el anuncio superior y empujaba la decisión principal fuera del primer scroll. Las garantías pasaron a la sección 7, con más peso visual y en el lugar donde aparece la duda.

## 3. Responsive

- **Grillas de producto (Home y catálogo):** `repeat(auto-fill, minmax(min(100%, 230px), 1fr))`. Las columnas se ajustan solas al ancho: 1 en celular, 2 en tablet, 3 o 4 en escritorio. El contenedor mide 1280 px, así que nunca pasan de 4. Si los precios en oferta se ven apretados, subir el mínimo a 250 px.
- **Filtros del catálogo en celular:** dos filas compactas. La primera (formato, género y familias) se desliza de lado; la segunda tiene la búsqueda y el orden. Desde `sm` vuelven a ser una sola barra.
- **Ficha en celular:** pirámide, foto del decant y espaciados más bajos; los relacionados son una fila deslizable (78 % de ancho por tarjeta) en lugar de una columna.
- **Contacto:** WhatsApp, Instagram y TikTok. El correo está oculto mientras `SITE.email` esté vacío; aparece solo al completarlo.

## 4. Semántica HTML

- **Landmarks:**
  - `header` y `nav[aria-label=Principal]`.
  - `main#contenido`, con un *skip link* «Saltar al contenido».
  - `footer` con tres `nav` etiquetados: Tienda, Ayuda y Legal.
- **Encabezados:**
  - Un solo `h1` por página.
  - Cada `section` tiene `aria-labelledby` apuntando a su `h2`.
  - En las grillas de producto, las tarjetas usan `h3` en la Home y `h2` en el catálogo, porque allí no hay un `h2` intermedio.
- **Tarjeta de producto:**
  - Es un `article` con un *stretched link*: un único `<a>` en el título, extendido con `::after`. Así se evitan enlaces anidados y el lector de pantalla anuncia un solo enlace con el nombre.
  - Los formatos disponibles son una `ul`.
- **Listas reales:**
  - Pasos (`ol`).
  - Pirámide olfativa (`ol` de etapas con `ul` de notas).
  - Garantías (`ul`).
  - Tamaños de decant (`dl`).
- **Formulario de producto:**
  - El selector de formato es un `fieldset` con `legend`.
  - Los botones usan `aria-pressed`.
  - La cantidad tiene `aria-live`.
- **FAQ:** `details/summary` nativo, accesible sin JS. La animación usa `::details-content` donde el navegador la soporta.
- **Bolsa:**
  - `role="dialog"` con `aria-modal`.
  - El foco se mueve al abrir y vuelve al cerrar; `Esc` la cierra.
- **Menú móvil:** `<dialog>` nativo, que gestiona el foco y el fondo inerte.
- **Imágenes:**
  - `alt` descriptivo en las imágenes de contenido.
  - `alt=""` en las decorativas (segunda imagen al pasar el mouse, miniaturas cuyo botón ya tiene `aria-label`).
- **Movimiento:**
  - Todo respeta `prefers-reduced-motion`.
  - El contenido nunca queda oculto si el JS falla: hay una salvaguarda de 3 s.

## 5. SEO técnico

| Elemento | Implementación |
|---|---|
| Títulos y descripciones | Uno por página; en producto: «Marca Nombre \| Perfume Original en Perú \| EJH PRIVÉ» (`src/lib/seo.ts`) |
| Categorías | `/decants/`, `/perfumes/…`, `/marcas/…`, `/familias/…`, en vivo desde el catálogo (`src/lib/categories.ts`); indexables desde 2 productos |
| URLs | `/productos/khamrah/`, en minúsculas. Un identificador con mayúsculas del panel (p. ej. `Vulcan-Feu`) redirige con 301 a su versión en minúsculas, y el panel ya guarda los nuevos en minúsculas |
| Canonical + Open Graph | En `Base.astro`; la imagen OG de cada producto es su foto |
| JSON-LD | `OnlineStore` y `WebSite` (global), `ItemList` (Home), `CollectionPage` (catálogo y categorías), `ProductGroup` con una variante por formato (PDP), `BreadcrumbList`, `FAQPage` (Cómo comprar) |
| Sitemap | `sitemap.xml`, generado en vivo (los anteriores redirigen) |
| `robots.txt` | Generado (`src/pages/robots.txt.ts`): bloquea `/admin`, `/gestion`, `/cms-api`, `/cms-assets`, `/api/`, `/cuenta` y los filtros `/productos/?…`, y declara el sitemap |
| `noindex` | En `/cuenta/`, `/sistema/` y la 404 |

## 6. Rendimiento

| Recurso | Decisión |
|---|---|
| HTML | Páginas fijas prerenderizadas. Home, catálogo, fichas y «Cómo comprar» se generan en una función de Vercel (precios y stock en vivo) y el CDN guarda la copia (`cachePage` en `src/lib/cms.ts`: `s-maxage=60, stale-while-revalidate=86400`, solo si el panel respondió), así el visitante no espera el arranque en frío. La ficha corrige stock y precio desde `/api/stock` al cargar, la bolsa vuelve a revisar precios y el panel cobra cada pedido al precio vigente |
| Región | Tienda y panel en `iad1` (Washington), junto a la base de datos. Moverlos a `gru1` (São Paulo) solo conviene si se mueven los tres juntos |
| JS | Solo las islas que lo necesitan: bolsa, botón de bolsa, compra en la PDP (~8 KB comprimidos en la Home sin contar React de las islas) |
| Imágenes | `astro:assets` → WebP responsive con `srcset`/`sizes`; *eager* + `fetchpriority=high` solo en la imagen LCP. Las fotos subidas al panel viven en Vercel Blob |
| Video del hero | `muted playsinline`, con *poster* y versión vertical para móvil (~0,9 MB). Se pausa fuera de pantalla |
| Fuentes | Cormorant Garamond y Manrope propias (API de fuentes de Astro), con *fallback* de métricas iguales; *preload* solo en la Home |
| Navegación | *Prefetch* al pasar el mouse + View Transitions |

## 7. Seguimiento de redes

Los clics en enlaces con `data-social` (sección Síguenos, contacto y pie de página) se registran como contacto con la red correspondiente (`trackContact` en `src/components/Tracking.astro`).

## 8. Pendientes del negocio (revisión del 23/11/2026)

- **Fotos de producto:** varias fotos subidas al panel vienen de otras tiendas (Fragancias Fiord, Amazon, Walmart) y la de Khamrah Qahwa es una miniatura marcada «CAMBIAR». Reemplazarlas por fotos propias (4:5, mínimo 1200 × 1500 px).
- **Datos legales:** razón social, RUC y dirección fiscal en `src/config/site.ts`; el Libro de Reclamaciones los exige. Falta también un correo de contacto: al ponerlo en `SITE.email` vuelve a aparecer en la página de contacto. (Instagram y TikTok ya están.)
- **Stock de decants:** solo Odyssey Spectra y Mandarin Sky tienen ml abiertos; el resto muestra los decants agotados. El stock lo maneja el sistema de gestión (en el panel es de solo lectura): registrar ahí las aperturas de frasco.
- **Precios:** Nitro Red no tiene precio de decants de 3 y 5 ml.
- **Identificadores:** renombrar `Vulcan-Feu` a `vulcan-feu` en el panel (la tienda ya redirige, pero así queda prolijo).
- **Legales:** política de devolución y términos.
- **Search Console:** ver `docs/SEO-GOOGLE-SEARCH-CONSOLE.md`.
- **Antispam:** resuelto con límites en la base de datos del panel (`cms/src/limits.ts`). Si aun así llega spam, sumar Cloudflare Turnstile.
- **Backend futuro:** pagos en línea (Izipay, Niubiz, Culqi o Mercado Pago), cuentas de cliente y newsletter. Mientras tanto, el pedido se registra en el panel y se cierra por WhatsApp.
