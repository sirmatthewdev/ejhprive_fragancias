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
9. **CTA final por WhatsApp:** cierre conversacional, el canal real de venta.

**Cambio respecto a la versión anterior.** Se quitó la barra de beneficios que estaba justo debajo del hero. Repetía lo que ya dice el anuncio superior y empujaba la decisión principal fuera del primer scroll. Las garantías pasaron a la sección 7, con más peso visual y en el lugar donde aparece la duda.

## 3. Semántica HTML

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

## 4. SEO técnico

| Elemento | Implementación |
|---|---|
| Títulos y descripciones | Uno por página; en producto: «Marca Nombre · EJH PRIVÉ» |
| URLs | `/productos/khamrah/`, en minúsculas. Un identificador con mayúsculas del panel (p. ej. `Vulcan-Feu`) redirige con 301 a su versión en minúsculas, y el panel ya guarda los nuevos en minúsculas |
| Canonical + Open Graph | En `Base.astro`; la imagen OG de cada producto es su foto |
| JSON-LD | `Store` (global, siempre con la imagen de marca), `ItemList` (Home), `Product` con `Offer` del frasco y su disponibilidad (PDP), `BreadcrumbList`, `FAQPage` |
| Sitemaps | `sitemap-index.xml` (páginas fijas, `@astrojs/sitemap`) y `sitemap-productos.xml` (fichas, generado en vivo desde el catálogo) |
| `robots.txt` | Generado (`src/pages/robots.txt.ts`): bloquea `/admin`, `/cms-api`, `/api/`, `/cuenta/` y `/sistema/` y declara los dos sitemaps |
| `noindex` | En `/cuenta/`, `/sistema/` y la 404 |

## 5. Rendimiento

| Recurso | Decisión |
|---|---|
| HTML | Páginas fijas prerenderizadas. Home, catálogo, fichas y «Cómo comprar» se generan en una función de Vercel (precios y stock en vivo) y el CDN guarda una copia de hasta 30 s (`s-maxage=10, stale-while-revalidate=20`), así el visitante no espera el arranque en frío |
| Región | Tienda y panel en `iad1` (Washington), junto a la base de datos. Moverlos a `gru1` (São Paulo) solo conviene si se mueven los tres juntos |
| JS | Solo las islas que lo necesitan: bolsa, botón de bolsa, compra en la PDP (~8 KB comprimidos en la Home sin contar React de las islas) |
| Imágenes | `astro:assets` → WebP responsive con `srcset`/`sizes`; *eager* + `fetchpriority=high` solo en la imagen LCP. Las fotos subidas al panel viven en Vercel Blob |
| Video del hero | `muted playsinline`, con *poster* y versión vertical para móvil (~0,9 MB). Se pausa fuera de pantalla |
| Fuentes | Google Fonts API (Cormorant Garamond y Manrope) con `preconnect` |
| Navegación | *Prefetch* al pasar el mouse + View Transitions |

## 6. Pendientes del negocio (revisión del 23/11/2026)

- **Fotos de producto:** varias fotos subidas al panel vienen de otras tiendas (Fragancias Fiord, Amazon, Walmart) y la de Khamrah Qahwa es una miniatura marcada «CAMBIAR». Reemplazarlas por fotos propias (4:5, mínimo 1200 × 1500 px).
- **Datos legales:** razón social, RUC y dirección fiscal en `src/config/site.ts`; el Libro de Reclamaciones los exige. También Instagram, TikTok y correo.
- **Stock de decants:** solo Odyssey Spectra y Mandarin Sky tienen ml abiertos; el resto muestra los decants agotados. Abrir frascos desde el panel («Abrir un frasco sellado»).
- **Precios:** Nitro Red no tiene precio de decants de 3 y 5 ml.
- **Identificadores:** renombrar `Vulcan-Feu` a `vulcan-feu` en el panel (la tienda ya redirige, pero así queda prolijo).
- **Legales:** política de devolución y términos.
- **Antispam:** el límite de pedidos y reclamos por IP vive en memoria de cada función; si llega spam, pasarlo a Vercel KV/Upstash o sumar Cloudflare Turnstile.
- **Backend futuro:** pagos en línea (Izipay, Niubiz, Culqi o Mercado Pago), cuentas de cliente y newsletter. Mientras tanto, el pedido se registra en el panel y se cierra por WhatsApp.
