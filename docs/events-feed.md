# Feed de eventos — octubre 2026

Ampliación solicitada: Explora incorpora un feed vertical de eventos con filtros por municipio/isla y categoría. Se conservan el mapa, Guardados, creación, borradores y publicación. Esta decisión sustituye las exclusiones de feed/reacciones del MVP de julio para el módulo de eventos.

## Diseño y datos

- Reutilizar `/api/events/explore`, el catálogo de ubicaciones y `event_favorites`. La consulta del feed es paginada, ordenada por fecha e identificador; no genera embeddings durante el scroll.
- Hasta cinco archivos en `event_images` y el bucket existente `event-images`, con foto en primera posición. JPG/PNG/WebP hasta 6 MiB; MP4/WebM hasta 50 MiB. No se renombran tablas ni se convierten registros antiguos. El tipo de vídeo se identifica por la extensión controlada del archivo y se valida contra los metadatos de Storage al guardar.
- Vídeos con controles, reproducción voluntaria y pausa al salir de pantalla. Sin sonido automático. Galería con botones accesibles y medios cargados bajo demanda.
- Likes independientes de los guardados: una reacción por usuario/evento, operación idempotente, contador en la vista del creador. No se expone la identidad de quienes reaccionan.
- Compartir mediante Web Share cuando está disponible, con alternativa para copiar el enlace.
- La interfaz, hooks, servicios HTTP y acceso a Supabase permanecen separados. No se modifica el radar ni sus reglas.

## Entorno y entrega

Solo existe Supabase de producción. Las migraciones se preparan para revisión, no se ejecutan automáticamente. Hace falta verificar el esquema real y las políticas antes de aplicarlas. El archivo `.env.local` permanece ignorado. No hacer commit, push ni despliegue hasta el OK del usuario tras probar localmente.

Esquema recibido el 04/10/2026: `event_images` ya limita las posiciones a 0–4 y garantiza posición única por evento. El bucket público limita a 6 MiB y solo imágenes; sus políticas permiten subidas bajo el ID del propietario. No existe `event_likes`. La ampliación SQL conserva las políticas actuales y las tablas existentes, añade likes con acceso exclusivo desde el servidor y permite MP4/WebM hasta 50 MiB. La configuración global de Storage también debe permitir 50 MiB.

## Referencias

- [Next 15: Route Handlers](https://nextjs.org/docs/15/app/api-reference/file-conventions/route)
- [Supabase: subidas reanudables](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)
- [MDN: compartir](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- [MDN: Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [MDN: scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap)
- [MDN: movimiento reducido](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)

## Comprobaciones

- `node --experimental-strip-types --test tests/*.test.mjs`: tipos/tamaños/rutas de archivos, permisos e idempotencia de likes, limpieza tras respuestas perdidas.
- SQL probado en PostgreSQL aislado (PGlite) con el esquema relevante: likes únicos, permisos, cambio de portada, conservación de galería ante fallo y ampliación del bucket.
- Navegador Chromium, 390×844 y 1280×900, con respuestas de prueba: scroll paginado, cambios de categoría, likes, guardados, compartir, galería y selector de archivos. No confirma persistencia ni subida real en Supabase.
- Revisar el límite global de Storage, la subida real por TUS, las políticas y el contador entre dos cuentas después de aprobar/aplicar la migración. La migración es un requisito previo al nuevo guardado de galerías; no desplegar el código antes.

La dependencia `tus-js-client` se carga solo al subir vídeos. Las tablas, nombres de servicios de imágenes y registros anteriores se conservan para limitar el cambio. `replace_event_media` sustituye el borrado/inserción separados por un guardado transaccional; un error SQL deja la galería anterior intacta.

Validación del 04/10/2026 tras aplicar el propietario la migración: compilación de producción correcta; conexión real, búsqueda por ciudad, guardar/quitar, likes idempotentes y retirada comprobados. Foto PNG y vídeo MP4 de 1,1 MB subidos mediante sesión de prueba (TUS para vídeo); galería persistida, vídeo servido y rechazo de vídeo como portada sin perder la galería. Contador del creador comprobado en Mis eventos. No se ha ejecutado commit/push.

## Vista inmersiva y apariencia

El feed se abre desde «Abrir feed» junto a «Crear evento». Explorar conserva mapa/lista; la vista inmersiva usa un diálogo nativo de pantalla completa, con foco contenido, salida visible y Escape, ciudad y categoría. Cada evento ocupa el alto disponible mediante scroll snap vertical; se conservan los estados de carga, errores y final de resultados. Las fotos llenan la tarjeta con recorte centrado (la galería del detalle conserva el encuadre completo), los vídeos mantienen sus controles y pausa al salir de pantalla. Referencias: [MDN scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap), [dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog), [Material: color y contraste en oscuro](https://design.google/library/material-design-dark-theme).

Ajustes incorpora Apariencia con sol/luna. La preferencia light/dark se guarda solo en localStorage (lookup-theme), se aplica antes del primer render y tolera almacenamiento bloqueado. Se mantienen los acentos de marca y se añaden superficies/textos oscuros con alias exactos para las utilidades de color existentes; no se invierten imágenes ni mapas. No precisa SQL ni nuevas dependencias.

Verificación de la revisión visual: TypeScript y ESLint sin errores; navegador a 390×844 y 1280×900, apertura desde cabecera, selección previa de ciudad, avance exactamente un alto de pantalla, categoría, salida con botón/Escape y tema oscuro persistente tras recargar. Corregido el anclaje inicial del scroll al cargar resultados y los degradados claros heredados en Ajustes. Cuenta temporal eliminada al terminar. Esta revisión no modifica la base de datos ni añade dependencias.

## Entrada directa al feed — 06/10/2026

Eventos abre el feed de la ciudad disponible en perfil/negocio. La provincia del negocio desambigua nombres; sin coincidencia única se pide elegir, nunca se adivina la ubicación. Una ciudad explícita en la URL tiene prioridad. No se solicita GPS adicional. El buscador reutiliza el catálogo de municipios/islas, con espera de 300 ms y cancelación de peticiones. El mapa queda como vista opcional; Guardados, Mis eventos y Crear permanecen accesibles bajo la cabecera. El estado vacío ofrece crear y cambiar de ciudad. Mantener la gestión tras crear un borrador y enlaces directos a Mis eventos/Guardados.

Referencias: [TikTok: funcionamiento de Para ti](https://newsroom.tiktok.com/how-tiktok-recommends-videos-foryou?lang=en-AU), [Material: app bars](https://m3.material.io/components/app-bars/), [MDN: scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap/Basic_concepts). Se adopta entrada directa al contenido, navegación estable y control de filtros; no se implementan recomendaciones comportamentales ni reproducción infinita de los mismos resultados.

Verificación de esta revisión: TypeScript y ESLint correctos. API local: Madrid se resuelve automáticamente, Cabanes sin provincia queda sin selección, Cabanes/Girona se desambigua, búsqueda inexistente vacía e islas disponibles. Navegador con Supabase real a 390×844 y 1280×900: entrada automática con ciudad del perfil, búsqueda de otra ciudad, estado vacío en Almenar de Soria, acceso a Crear (sin guardar), Guardados, Mis eventos, retorno al feed y salida con Escape; revisados temas claro y oscuro. No se han publicado eventos ni cambiado el esquema.

Ajuste visual: cabecera y feed comparten el ancho máximo del dashboard (672 px, con 24 px interiores en escritorio y 16 px en móvil), margen superior y títulos azules. Accesos repartidos en cuatro botones iguales con icono y etiqueta. Fondos claros azulados y líneas azules discretas en oscuro, sin parpadeos ni animación continua. El interruptor del Radar apagado usa pista y pulgar contrastados en oscuro; no cambia la lógica ni el aspecto activo.

Comprobado el ajuste visual a 390×844 y 1280×900, con ambos temas; título Actividades #5D5FEF, interruptor apagado legible en oscuro y accesos uniformes. TypeScript y ESLint sin errores. No se ha encendido el Radar ni alterado su comportamiento durante la prueba.

## Vídeo móvil y galería ampliada — 07/10/2026

Los archivos nuevos admiten MP4/M4V, MOV, WebM, 3GP y OGV (50 MiB como antes), hasta **59 segundos**. Se normalizan MIME vacíos y alias de proveedores de archivos/iOS; no se acepta contenido activo por cambiarle la extensión. El navegador comprueba las duraciones que puede leer antes de añadir archivos; si el códec no permite leer metadatos locales, el servidor sigue siendo la autoridad. Guardar/publicar espera a que termine la comprobación local.

La API de galería descarga únicamente objetos del propietario/evento ya comprobados en Storage y examina sus pistas/duración real mediante `mediainfo.js`, solo en servidor, antes de la operación transaccional. Rechaza archivos sin vídeo y duraciones desconocidas, no positivas o mayores de 59 segundos. Examina también audio y duración general. No acepta duración declarada por el cliente. Un rechazo conserva la galería anterior. La dependencia se mantiene externa al empaquetado de Next y el archivo WASM se incluye explícitamente en el rastreo del despliegue. Los enlaces externos existentes no se descargan, no se analizan y no tienen este límite; se explica junto a su campo.

**Requisito de Storage:** aplicar `scripts/sql/events-video-formats.sql` antes de desplegar. Es idempotente y solo añade formatos permitidos; conserva políticas, visibilidad y límites de tamaño. Verificado el 07/10: el bucket de producción aún no permite MOV. No se ha modificado automáticamente.

No hay conversión de códecs ni servicio de transcodificación: admitir MOV no garantiza reproducir HEVC/ProRes en todos los navegadores. La compatibilidad universal necesita una decisión adicional de infraestructura; no se han contratado servicios. La prueba de iPhone físico sigue pendiente.

Las acciones quedan centradas bajo la imagen, dentro de la tarjeta, sin tapar contenido ni controles. Un enlace extendido abre el detalle al pulsar la foto/contenido; controles de vídeo, cambio de archivo, likes, guardados y compartir quedan por encima y son independientes. Se mantiene el scroll nativo y no hay manejadores de navegación en touchstart/touchend.

El detalle amplía la foto o el archivo activo en un `dialog` nativo con cierre visible, Escape, foco contenido y restitución del foco. El carrusel admite botones, flechas de teclado y deslizamiento horizontal sobre fotos; los gestos del vídeo mantienen sus controles nativos. El vídeo del detalle se desmonta al abrir el visor para no dejar dos reproducciones activas. Imágenes ampliadas sin recorte; sin una librería adicional de carrusel.

Referencias: [Apple: formatos web](https://developer.apple.com/videos/play/wwdc2023/10122/), [Supabase: límites y restricciones por bucket](https://supabase.com/docs/guides/storage/uploads/file-limits), [MediaInfo: lectura de metadatos](https://mediainfo.js.org/docs/getting-started/usage/), [W3C: diálogo modal y foco](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

Pruebas: 17 comprobaciones automatizadas, incluidos vídeos generados de 59/60 segundos, MOV y WebM, archivos falsos, MIME de iPhone, limpieza y permisos/reacciones anteriores. Integración real con cuenta temporal y evento no listado: TUS + guardado de 59 segundos, rechazo de 60 y archivo falso conservando la galería. No se usan eventos de usuarios para escribir datos.

Cierre de pruebas el 08/10/2026: selección de MOV y rechazo de 60 segundos comprobados en el formulario; navegación desde la foto, visor individual, carrusel mixto y reproducción real de 59 segundos, Escape y foco, compartir independiente y feed oscuro/escritorio comprobados. Cuenta, evento y objetos temporales eliminados. SQL verificado en PostgreSQL aislado: idempotencia, conservación de formatos existentes, lista nula, tamaño, visibilidad y otros buckets. ESLint de los archivos modificados sin errores.

Compilación de producción completada correctamente. Verificada la inclusión del analizador de vídeo y su archivo WASM en el paquete del servidor para Vercel. Solo aparecen los cuatro avisos previos de variables sin uso del módulo de ubicaciones.

## Corrección del paquete de Vercel — 08/10/2026

Vercel completaba el build de `caed985`, pero rechazaba la función al desplegar: el trace contenía el enlace `apps/web/node_modules/mediainfo.js` y, simultáneamente, un archivo dentro de él (`dist/MediaInfoModule.wasm`). La inclusión ahora resuelve la ruta física con `realpathSync` y la convierte en relativa a la aplicación, sin fijar la estructura ni versión de pnpm. Se conserva la dependencia externa y su carga en servidor. Turbo declara las cinco variables usadas por la aplicación e incluye los `.env*` del paquete entre las entradas de caché.

Validación: build de producción completo, ESLint de la configuración, ausencia de archivos bajo entradas de enlaces simbólicos en el trace de la función, WASM incluido y lectura real de un vídeo de 59 segundos desde una copia aislada de los archivos trazados. La confirmación definitiva del despliegue requiere que Vercel alcance Ready con este nuevo commit.
