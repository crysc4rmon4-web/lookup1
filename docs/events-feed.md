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
