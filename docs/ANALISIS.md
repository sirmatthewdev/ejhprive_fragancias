# EJH PRIVÉ: análisis de maquetación y semántica

Este documento analiza la landing y las páginas de tienda desde el frontend, en función del negocio: una perfumería árabe de catálogo corto (seis fragancias) cuyo diferencial son los **decants de 3 y 5 ml**, con venta asistida por **WhatsApp**.

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
3. **La colección:** los seis productos. Cada tarjeta muestra frasco y decant al pasar el mouse.
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
| URLs | `/productos/khamrah/`, legibles y estables, con barra final consistente |
| Canonical + Open Graph | En `Base.astro`; la imagen OG de cada producto es su foto |
| JSON-LD | `Store` (global), `ItemList` (Home), `Product` (PDP; `Offer` se emite cuando haya precio), `BreadcrumbList`, `FAQPage` |
| Sitemap | `@astrojs/sitemap` |
| `noindex` | En `/cuenta/` y en la 404 |

## 5. Rendimiento

| Recurso | Decisión |
|---|---|
| HTML | Estático (SSG): 14 páginas prerenderizadas |
| JS | Solo las islas que lo necesitan: bolsa, botón de bolsa, compra en la PDP |
| Imágenes | `astro:assets` → WebP responsive con `srcset`/`sizes`; *eager* + `fetchpriority=high` solo en la imagen LCP |
| Video del hero | `muted playsinline`, con *poster* y versión vertical para móvil. Se pausa fuera de pantalla |
| Fuentes | Auto-alojadas con `@fontsource` (sin dependencia de Google Fonts) |
| Navegación | *Prefetch* al pasar el mouse + View Transitions |

## 6. Pendientes del cliente

- **Precios:** hoy `null` en `src/data/products.ts`. Con el valor cargado, el sitio muestra el precio, calcula subtotales y emite `Offer` en schema.
- **Contacto:** WhatsApp, Instagram, TikTok, correo y dominio, en `src/config/site.ts`.
- **Legales:** política de devolución y términos.
- **Ficha técnica:** las barras de duración, proyección y dulzor son estimaciones editoriales que conviene validar.
- **Backend:**
  - Cuentas de usuario.
  - Pagos en línea: en Perú, Izipay, Niubiz o Culqi (tarjetas y Yape), o Mercado Pago.
  - Newsletter.
  - Mientras tanto, el pedido se cierra por WhatsApp con el detalle de la bolsa.
