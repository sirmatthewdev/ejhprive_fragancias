# Informe de implementación SEO

Fecha: 25/11/2026 · Rama: `seo-google-search` · Sin publicar en producción.

## Estado por área

Leyenda: ✅ implementado y probado · 🟡 implementado, falta validación externa · 🔧 pendiente de configuración manual · ➖ no aplica

| Área | Estado | Observaciones |
|------|--------|--------------|
| Sitemap | ✅ | `/sitemap.xml` único y en vivo, con `lastmod` e imágenes. Los tres anteriores redirigen (301) |
| Robots.txt | ✅ | Privadas y filtros del catálogo bloqueados; `/sistema/` abierto para que se lea su `noindex` |
| Canonical | ✅ | Siempre `https://www.`, con barra final y sin parámetros. Sin barra → 308 (reglas evaluadas con el motor de rutas de Vercel; falta verlas en un despliegue) |
| Metadatos | ✅ | Títulos y descripciones únicos en las 30 URL de prueba; Open Graph y Twitter completos |
| Schema.org | 🟡 | Precios de los datos estructurados = precios visibles (comprobado en todas las fichas). Falta la prueba de resultados enriquecidos de Google, que exige la URL publicada |
| Productos | ✅ | Precio por formato visible; una ficha por perfume; variantes como `ProductGroup` |
| Categorías | ✅ | Decants, hombre, mujer, unisex, marcas y familias. «Diseñador»: ➖ hoy no hay productos |
| Core Web Vitals | 🟡 | Home y ficha dentro del objetivo en laboratorio; catálogo en 3,4 s de LCP (antes 3,7 s). Faltan datos reales de usuarios |
| Search Console | 🔧 | Todo listo; falta agregar el TXT en Hostinger y verificar |
| Analytics | 🔧 | Probado con el contenedor real; falta cargar `PUBLIC_GTM_ID` en Vercel |
| Seguridad | ✅ | API privada cerrada a anónimos (403); el stock exacto ya no se publica; `X-Robots-Tag` en rutas internas |

## 1. Auditoría inicial

**Stack comprobado:** Astro 7.4 (tienda: páginas fijas prerenderizadas; inicio, catálogo y fichas en SSR con caché de CDN), React 19 en islas, Payload CMS 3 + Next.js (`cms/`), Postgres en Neon, Vercel Blob, despliegue en Vercel, DNS en Hostinger. La gestión de inventario es otra aplicación (`gestion.ejhprive.com`) que envía el stock al panel; aquí no se tocó.

| # | Problema detectado | Impacto SEO | Prioridad | Solución | Estado |
|---|---|---|---|---|---|
| 1 | `/productos/khamrah` y `/productos/khamrah/` respondían 200, cada una canónica de sí misma | Contenido duplicado en todo el sitio | Alta | Canonical normalizado + 308 | ✅ |
| 2 | Marca, familia, género y decants solo existían como filtros `?…` canónicos a `/productos/` | Ninguna página podía posicionar «perfumes Lattafa» o «decants Perú» | Alta | Páginas de categoría propias | ✅ |
| 3 | `ejhprive-fragancias.vercel.app` servía una copia completa | Duplicado en otro dominio | Alta | 308 al dominio propio (salvo panel y API) | ✅ |
| 4 | `Product` declaraba solo el frasco: un perfume con decants y sin frascos figuraba agotado | Disponibilidad y precio incorrectos | Alta | `ProductGroup` con una variante por formato | ✅ |
| 5 | Con el panel caído, las fichas creadas en el panel daban 404 | Riesgo de desindexación por una caída | Alta | 503 + `Retry-After` | ✅ |
| 6 | Textos `[… a confirmar]` públicos en preguntas, legales y JSON-LD | Calidad y confianza | Alta | Se ocultan hasta tener el texto real | ✅ |
| 7 | No había `/sitemap.xml`; sin `lastmod`; la lista incompleta por caída se guardaba una hora | Rastreo | Media | Sitemap único en vivo | ✅ |
| 8 | Títulos genéricos («Productos · EJH PRIVÉ»), descripción del catálogo de 244 caracteres | CTR | Media | Títulos y descripciones por intención | ✅ |
| 9 | `robots.txt` bloqueaba `/sistema/`, que tiene `noindex` | Google no podía leer el `noindex` | Media | Se abre y se refuerza con cabecera | ✅ |
| 10 | Google Fonts bloqueaba el primer pintado | LCP/FCP | Media | Fuentes alojadas en el sitio (API nativa de Astro) | ✅ |
| 11 | «Eau de Parfum» escrito fijo en todas las fichas, sin dato que lo respalde | Información no verificada | Media | Retirado | ✅ |
| 12 | `FAQPage` repetido en inicio y Cómo comprar; `ItemList` con URL relativas | Datos estructurados inválidos | Media | Una sola vez; URL absolutas | ✅ |
| 13 | `/api/stock` y el HTML publicaban el stock exacto | Exposición de inventario | Media | Tope igual al máximo por bolsa | ✅ |
| 14 | Faltaban `twitter:*` y `og:image:alt`; H1 de inicio leído «llevaruna» | Menor | Baja | Corregido | ✅ |
| 15 | Con GTM y GA4 configurados a la vez, cada evento se enviaba por las dos vías | Métricas infladas | Media | Una sola vía | ✅ |
| 16 | Fotos tomadas de otras tiendas; una marcada «CAMBIAR» | Derechos de autor, imágenes duplicadas | Alta | Reemplazar en el panel | 🔧 propietario |

**Ya estaba bien:** HTML completo sin depender de JS, 404 reales, `http`→`https` y sin `www`→`www` (308), HSTS, imágenes WebP con `alt` y dimensiones, consentimiento de cookies, `noindex` en el panel y en gestión.

## 2. Qué se implementó

- **Metadatos** (`src/layouts/Base.astro`, `src/lib/seo.ts`): patrón `X | EJH PRIVÉ`, título de producto que se acorta para caber en ~60 caracteres, `max-image-preview:large`, `es-PE`. Sin `hreflang`: hay un solo idioma y país.
- **Categorías** (`src/lib/categories.ts`): salen del catálogo en vivo. Con menos de 2 productos con ficha quedan en `noindex` y fuera del sitemap; con 0, 404. Los textos usan solo datos del panel y de las fichas. Los filtros del catálogo siguen funcionando igual.
- **Datos estructurados:** `OnlineStore` (subtipo de `Organization`) + `WebSite` en todas las páginas; `ProductGroup`/`Product`/`Offer` en PEN; `CollectionPage` + `ItemList` en listados; `BreadcrumbList`; `FAQPage` en Cómo comprar. **Sin** valoraciones, SKU, política de devolución ni costos de envío, porque no hay datos reales. Un formato sin precio no se declara. Sin `SearchAction`: Google retiró esa función.
- **Fichas:** precio por formato, enlaces a género y familia, miga con la marca, caché de respaldo de 24 h a 1 h para que Google no lea una disponibilidad vieja.
- **Rendimiento:** fuentes propias, una sola foto prioritaria por listado, tamaños de imagen intermedios, botón de bolsa hidratado en reposo.
- **Analítica:** `view_item_list`, `select_item` y `remove_from_cart` nuevos; lo visto antes de aceptar cookies se envía solo si se aceptan.
- **Dependencias:** ninguna nueva; se quitó `@astrojs/sitemap`.

### Archivos

**Creados:** `src/lib/seo.ts`, `src/lib/categories.ts`, `src/components/CategoryView.astro`, `src/pages/decants.astro`, `src/pages/marcas/[slug].astro`, `src/pages/familias/[slug].astro`, `src/pages/perfumes/[slug].astro`, `src/pages/sitemap.xml.ts`, `docs/SEO-IMPLEMENTATION-REPORT.md`, `docs/SEO-GOOGLE-SEARCH-CONSOLE.md`.

**Eliminado:** `src/pages/sitemap-productos.xml.ts` (lo reemplaza `sitemap.xml.ts`).

**Modificados:** `astro.config.mjs`, `vercel.json`, `package.json`, `package-lock.json`, `.env.example`, `README.md`, `docs/ANALISIS.md`, `cms/next.config.ts` (solo la cabecera `X-Robots-Tag`), `src/config/site.ts`, `src/data/faq.ts`, `src/layouts/Base.astro`, `src/styles/global.css`, `src/lib/{catalog,cms,home,stock,track}.ts`, `src/components/{Footer,Header,ProductCard,Tracking}.astro`, `src/components/home/{FamilyIndex,Hero}.astro`, `src/components/islands/{CartDrawer,ProductBuy}.tsx`, `src/components/ui/Breadcrumbs.astro`, `src/pages/{404,como-comprar,contacto,index,libro-de-reclamaciones,nosotros,politica-de-devolucion}.astro`, `src/pages/productos/{index,[slug]}.astro`, `src/pages/api/stock.ts`, `src/pages/robots.txt.ts`.

Sin cambios en colecciones, migraciones ni datos del panel.

## 3. Matriz de palabras clave

Sin volúmenes: no hay datos verificables todavía. Se revisa con Search Console tras 4 a 8 semanas.

| URL | Keyword principal | Secundarias | Intención | Title | Meta description | Contenido | Prioridad |
|---|---|---|---|---|---|---|---|
| `/` | perfumes originales en Perú | perfumería árabe, EJH PRIVÉ | Marca / comercial | EJH PRIVÉ \| Perfumes Árabes Originales y Decants en Perú | Perfumes árabes originales en Perú: Lattafa, Armaf, Afnan y Rasasi… | Inicio | Alta |
| `/productos/` | perfumes árabes originales en Perú | comprar perfumes online Perú | Transaccional | Perfumes Árabes Originales en Perú \| EJH PRIVÉ | Perfumes árabes originales en Perú: (nombres)… | Catálogo | Alta |
| `/decants/` | decants de perfumes Perú | muestras de perfumes originales | Transaccional | Decants de Perfumes Originales de 3 y 5 ml \| EJH PRIVÉ | Decants de perfumes originales en Perú: muestras de 3 y 5 ml… | Categoría | Alta |
| `/marcas/lattafa/` | perfumes Lattafa Perú | Lattafa original | Comercial | Perfumes Lattafa Originales en Perú \| EJH PRIVÉ | Perfumes Lattafa originales en Perú: (nombres)… | Marca | Alta |
| `/marcas/armaf/` | perfumes Armaf Perú | Armaf Odyssey | Comercial | Perfumes Armaf Originales en Perú \| EJH PRIVÉ | Perfumes Armaf originales en Perú: (nombres)… | Marca | Media |
| `/productos/khamrah/` | comprar Lattafa Khamrah | Khamrah precio, Khamrah decant | Transaccional | Lattafa Khamrah \| Perfume Original en Perú \| EJH PRIVÉ | Compra Lattafa Khamrah original en Perú: canela, dátiles, vainilla… | Producto | Alta |
| `/productos/9-pm/` | comprar Afnan 9 PM | perfumes Afnan Perú, 9PM | Transaccional | Afnan 9 PM \| Perfume Original en Perú \| EJH PRIVÉ | Compra Afnan 9 PM original en Perú: manzana, lavanda, vainilla… | Producto | Alta |
| `/productos/<perfume>/` | comprar (marca + nombre) | (nombre) decant, precio | Transaccional | (Marca Nombre) \| Perfume Original en Perú \| EJH PRIVÉ | Compra (Marca Nombre) original en Perú: (acorde)… | Producto | Media |
| `/perfumes/hombre/` | perfumes para hombre Perú | perfumes originales hombre | Comercial | Perfumes para Hombre Originales en Perú \| EJH PRIVÉ | Perfumes para hombre originales en Perú: (nombres)… | Categoría | Media |
| `/perfumes/mujer/` | perfumes para mujer Perú | perfumes originales mujer | Comercial | Perfumes para Mujer Originales en Perú \| EJH PRIVÉ | Perfumes para mujer originales en Perú: (nombres)… | Categoría | Media |
| `/perfumes/unisex/` | perfumes unisex Perú | — | Comercial | Perfumes Unisex Originales en Perú \| EJH PRIVÉ | Perfumes unisex originales en Perú: (nombres)… | Categoría | Baja |
| `/familias/<familia>/` | perfumes (familia) | notas de la familia | Investigación | Perfumes de Familia (X) en Perú \| EJH PRIVÉ | Perfumes originales de familia (x): (nombres)… | Categoría | Baja |
| `/como-comprar/` | cómo comprar perfumes online | Yape, Plin, cuotas, envíos | Informativa | Cómo Comprar Perfumes Online en Perú \| EJH PRIVÉ | Comprar en EJH PRIVÉ: elige tu perfume… | Ayuda | Media |
| `/nosotros/` | EJH PRIVÉ | perfumería árabe en Perú | Marca | Quiénes Somos: Perfumería Árabe en Perú \| EJH PRIVÉ | EJH PRIVÉ: perfumería árabe original en Perú… | Institucional | Baja |

- **Perfumes Afnan Perú:** con una sola fragancia, la responde la ficha de 9 PM. `/marcas/afnan/` se vuelve indexable sola al sumar la segunda.
- **Perfumes de diseñador:** no hay productos hoy y el panel no tiene un campo que los distinga. Cuando entren, hay que agregar ese campo y entonces su página. Las otras categorías no dicen «árabes» para que no queden falsas.

## 4. Rendimiento

Mismo equipo, móvil simulado (Lighthouse, mediana de 5), build anterior y nuevo, ambos con el mismo catálogo de prueba:

| Página | FCP antes → ahora | LCP antes → ahora | CLS ahora | Puntaje antes → ahora |
|---|---|---|---|---|
| Inicio | 1,54 → 1,09 s | 3,38 → **1,09 s** | 0,000 | 91 → 100 |
| Catálogo | 1,54 → 1,14 s | 3,66 → **3,44 s** ⚠️ | 0,003 | 89 → 91 |
| Ficha | 1,54 → 1,10 s | 2,63 → **2,51 s** | 0,000 | 96 → 97 |

- El catálogo sigue por encima de 2,5 s **en simulación lenta**; lo que queda es el JavaScript de React (64 KB) y de animación (52 KB), que compiten con la foto. Bajarlo exige cambiar la arquitectura de la bolsa o de las animaciones: no se hizo.
- INP no se mide en laboratorio; lo da Search Console con usuarios reales. TBT: 10–110 ms.
- Prueba sin las fotos reales del panel; volver a medir tras publicar con PageSpeed Insights.

## 5. Pruebas

| Prueba | Resultado |
|---|---|
| `npm run build` (tienda) | ✅ |
| `next build` y `tsc` (panel, base de datos desechable) | ✅ |
| Pruebas automáticas | ➖ El proyecto no tiene |
| `astro check` / `tsc` de la tienda | ➖ TypeScript no está instalado en la tienda |
| ESLint del panel | ❌ No arranca: falla al cargar la configuración compartida que extiende, antes de analizar ningún archivo. No se corrigió |
| Enlaces internos rastreados | ✅ 32 páginas, ninguna rota ni sin barra final |
| JSON-LD | ✅ 54 bloques válidos, precios visibles en la página, sin SKU ni valoraciones |
| Agotado, sin precio, oferta con fecha, oculto, sin ficha, `</script>` en la descripción | ✅ |
| Panel caído | ✅ 503 donde corresponde, nada se guarda en caché, sitemap `no-store` |
| Redirecciones | ✅ Sin bucles |
| GA4 con el contenedor real | ✅ Nada antes de aceptar cookies; cada evento una vez (envíos bloqueados: no se ensuciaron los datos) |
| Bolsa, variantes y filtros en navegador | ✅ Sin errores de consola |
| API anónima en producción | ✅ 403 en productos, pedidos, usuarios, reclamos y movimientos |

El catálogo de prueba fue un panel simulado con los 12 perfumes y casos límite; no se usaron ni modificaron datos de producción.

## 6. Pendiente del propietario

1. **Autorizar la publicación** de la rama `seo-google-search` (despliega la tienda y el panel).
2. **TXT en Hostinger** y verificación en Search Console ([guía](SEO-GOOGLE-SEARCH-CONSOLE.md)).
3. **`PUBLIC_GTM_ID=GTM-NWLRTWMC`** en Vercel y volver a desplegar; confirmar ahí que `SITE_URL=https://www.ejhprive.com`.
4. **Datos del usuario en GA4:** desactivar la recopilación automática o actualizar la política de privacidad.
5. **Fotos propias** de producto (4:5, mínimo 1200 × 1500).
6. **Textos legales:** devoluciones, términos, razón social, RUC, dirección y correo. Mientras tanto esas secciones dicen «Estamos preparando esta sección».
7. **Panel:** escribir «French Avenue» y «Dumont» sin mayúsculas sostenidas (la marca no coincide con «Marcas» y su logo no aparece); cargar precios de decants de Nitro Red; registrar aperturas de frasco, porque casi todos los decants figuran agotados; revisar «Inspirado en God of Fire…» en Vulcan Feu (marca de terceros).
8. **Concentración** (EDP/EDT) de cada perfume: confirmarla para sumar un campo en el panel.
9. Tras publicar: prueba de resultados enriquecidos, PageSpeed Insights y envío del sitemap.

Riesgo menor conocido: `/cms-api/media` lista públicamente los nombres de las fotos subidas. No contiene datos privados y la tienda lo necesita para leer las imágenes compartidas.
