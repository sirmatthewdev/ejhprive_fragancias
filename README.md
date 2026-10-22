# EJH PRIVÉ: tienda web

Sitio de EJH PRIVÉ, perfumería árabe original con frascos de 100 ml y decants de 3 y 5 ml.

## Stack

| Capa | Elección | Por qué |
|---|---|---|
| Framework | **Astro 7** (SSG + rutas de servidor) | Sitio de contenido y catálogo corto: HTML estático, cero JS por defecto, SEO y rendimiento de base |
| Interactividad | **React 19** como islas | Solo donde hay estado: bolsa, selector de formato y cantidad |
| Estado | **nanostores** | Bolsa compartida entre islas y páginas, persistida en `localStorage` |
| Estilos | **Tailwind CSS v4** | Tokens de marca en `@theme` (`src/styles/global.css`) |
| Animación | **GSAP** (ScrollTrigger, SplitText, Flip) + **Lenis** | Revelados por línea, cortinas de imagen, parallax, filtros con Flip, scroll suave |
| Transiciones | **View Transitions** de Astro | Fundido entre páginas e imagen compartida de tarjeta a producto |
| Íconos de marca | **simple-icons** | Visa, Amex, Mercado Pago, Instagram, TikTok y WhatsApp oficiales |
| Fuentes | **@fontsource** | Cormorant Garamond y Manrope auto-alojadas |

## Dos aplicaciones

| Carpeta | Qué es | Puerto local |
|---|---|---|
| `/` (raíz) | Tienda pública (Astro) | http://localhost:4321 |
| `cms/` | Panel de administración y API (Payload CMS 3 + Next.js) | http://localhost:3000/admin |

La tienda pide al CMS precios, stock y visibilidad en cada visita, con 30 s de caché. También registra ahí los pedidos, usando la API key del usuario «Tienda (API)». Si el CMS no responde, la tienda sigue funcionando con precios «A confirmar».

## Comandos

```sh
# panel (primera vez)
cd cms && npm install && npm run seed   # crea los 6 productos, 2 administradores y la API key de la tienda
npm run dev                             # http://localhost:3000/admin

# tienda
npm install
cp .env.example .env                    # pegar CMS_API_KEY que imprimió el seed
npm run dev                             # http://localhost:4321
npm run build && npm start              # producción
```

## Panel de administración (cms/)

- **Pedidos:**
  - Los que vienen de la web llegan como **Pendiente**, con número `EJH-0001`, `EJH-0002`, etc. Ese número viaja en el mensaje de WhatsApp.
  - Estados: Pendiente → Confirmado → En preparación → Enviado (transportista y código de seguimiento) → Entregado, o Cancelado.
  - Cada cambio queda en el **Historial** con la fecha y quién lo hizo.
  - El botón **«Avisar al cliente por WhatsApp»** arma el mensaje según el estado.
- **Stock por fragancia:** frascos sellados (para vender frascos de 100 ml) y ml abiertos para decants (lo único con lo que se venden decants de 3 y 5 ml).
  - Si no hay ml suficientes, la tienda muestra los decants agotados y no deja agregarlos a la bolsa. Para sumar ml, el equipo marca «Abrir un frasco sellado» en el producto (−1 frasco, +100 ml).
  - Al **confirmar** un pedido se descuenta.
  - Al **cancelar** o volver a Pendiente, se repone.
  - Un pedido que ya descontó stock no permite editar sus productos.
- **Precios:** por formato hay precio regular y precio de oferta, más una fecha opcional de fin de la oferta. La tienda muestra la oferta con el regular tachado y el % de descuento; los pedidos se cobran al precio vigente.
- **Libro de Reclamaciones:** cada hoja enviada desde `/libro-de-reclamaciones/` llega con número correlativo (`000001-2026`) y la fecha límite de respuesta (15 días hábiles). El inicio del panel avisa cuando hay hojas sin responder.
- **Movimientos de stock:** registro automático de ventas, devoluciones, aperturas de frasco y ajustes manuales.
- **Inicio del panel:** pedidos por estado, últimos pedidos y alertas de stock bajo o agotado.
- **Roles:**
  - *Administrador*: todo.
  - *Equipo*: pedidos, productos y stock.
  - *Tienda (API)*: solo puede crear pedidos pendientes; los precios los recalcula el servidor.
- **Base de datos:** SQLite en local (`cms/ejh.db`). Para producción se recomienda Postgres (por ejemplo Neon) con `@payloadcms/db-postgres`.

## Estructura

```
src/
  config/site.ts          datos del negocio (WhatsApp, redes, dominio)
  data/products.ts        catálogo, notas, precios (null = a confirmar)
  data/faq.ts             preguntas frecuentes + JSON-LD
  lib/cart.ts             store de la bolsa
  lib/motion.ts           capa de animación (data-split, data-reveal, data-clip, data-parallax, data-magnetic, cursor)
  layouts/Base.astro      head/SEO, header, footer, bolsa, cursor
  components/             Header, Footer, ProductCard, home/Hero, home/FamilyIndex, ui/*
  components/islands/     CartButton, CartDrawer, ProductBuy (React)
  pages/                  index, productos/, productos/[slug], nosotros, como-comprar, contacto, politica-de-devolucion, cuenta (→ panel), api/orders, sistema, 404
  lib/cms.ts              conexión con el CMS: catálogo en vivo y creación de pedidos
cms/src/
  collections/            Orders, Products, InventoryMovements, Users, Media
  inventory.ts            lógica de stock (ml por decant, apertura de frascos)
  components/             Dashboard, aviso por WhatsApp, marca del panel
  seed.ts                 datos iniciales
docs/ANALISIS.md          análisis de maquetación, semántica y SEO
```

## Para lanzar

1. Cargar precios y stock reales desde el panel. Cambiar las contraseñas y los correos de los dos administradores.
2. Cargar los datos de contacto, la razón social, el RUC y la dirección fiscal (se muestran en el Libro de Reclamaciones y el footer) y el dominio en `src/config/site.ts` y `astro.config.mjs` (`site`).
3. Redactar los textos legales en `src/pages/politica-de-devolucion.astro`. Configurar un adaptador de correo en el panel (por ejemplo Resend) para enviar al consumidor la copia de su hoja de reclamación.
4. Desplegar el panel (`cms/`) en Vercel o Railway con Postgres, configurando `PAYLOAD_SECRET`, `DATABASE_URL`, `CMS_URL` y `STORE_URL`.
5. Desplegar la tienda en un hosting con Node (Railway, Render o un VPS), configurando `CMS_URL` y `CMS_API_KEY`. Las páginas informativas son estáticas; la home, el catálogo, las fichas y `/api/orders` corren en el servidor.

## Créditos de imágenes

- Decants en estuche de cuero: foto de [Pexels #7000326](https://www.pexels.com/photo/7000326/) (licencia Pexels: uso comercial gratuito, sin atribución obligatoria). Ajuste de color propio.
- Logos de Lattafa, Armaf, Rasasi, Afnan, Powerpay, Yape y Plin: marcas de sus respectivos titulares, usadas para identificar los productos y medios de pago que se comercializan.
- Fotos de producto, video del hero y composiciones: generadas para este proyecto a partir de recortes de producto.
