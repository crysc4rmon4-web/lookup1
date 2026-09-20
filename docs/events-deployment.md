# Events: configuración y prueba antes de desplegar

## Configuración

- Versiones: Next 15.5.9 y pnpm 10.12.1. En Vercel, proyecto web con Root Directory `apps/web` y acceso a los paquetes del workspace.
- `NEXT_PUBLIC_SUPABASE_URL`: URL base del proyecto, sin `/rest/v1` ni `/auth/v1`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave pública del mismo proyecto.
- `SUPABASE_SERVICE_ROLE_KEY`: clave **privada del servidor**, del mismo proyecto. Las rutas de eventos la necesitan además del inicio de sesión del navegador. Configurar en Production y en Preview si se usan previews. No incluirla en Git ni usar prefijo `NEXT_PUBLIC_`.
- Stadia: localhost no requiere clave. Para producción, autorizar `lookup1-web.vercel.app` en Stadia o configurar `NEXT_PUBLIC_STADIA_MAPS_API_KEY` con restricciones para los dominios usados. Los previews de Vercel necesitan autorización propia. No añadir una clave privada de administración.
- `LOOKUP_GEOCODER_BASE_URL` y `LOOKUP_GEOCODER_USER_AGENT`: proveedor compatible con Nominatim e identificación de la aplicación. El servicio público está sujeto a límites; una respuesta 429/403 requiere revisar el proveedor o su configuración, no saltarse la verificación de dirección.
- `OPENAI_API_KEY` es opcional para el consejo generado: el análisis existente conserva su alternativa sin IA.

Las variables locales no viajan con el push. Los cambios de variables en Vercel requieren un nuevo despliegue; las `NEXT_PUBLIC_` se incorporan al compilar. Mantener las mismas tablas y políticas de Supabase: `profiles`, `events`, `event_categories`, `event_images`, `event_insights` y Storage de eventos.

## Flujo de comprobación

1. Iniciar sesión con la cuenta de pruebas y abrir Mis eventos. Si falla antes de guardar, revisar los logs de las funciones y las variables del servidor.
2. Buscar Soria y elegir **Municipio · Provincia de Soria**. Buscar un nombre repetido (por ejemplo, Cabanes) y comprobar que se distingue la provincia.
3. Verificar fondo del mapa, zoom, arrastre, controles en móvil, categorías y navegación desde puntos/lista. Los puntos comparten los datos filtrados de la lista y usan las coordenadas guardadas. Varios eventos en las mismas coordenadas se agrupan sin alterar su dirección.
4. Crear un evento de prueba con fecha futura. Guardar borrador y comprobar Mis eventos > Borradores.
5. Crear con portada y usar Revisar y publicar. Leer Intelligence en el formulario, publicar y comprobar Mis eventos > Activos. Un fallo de análisis/publicación conserva el borrador y permite reintentar sin crear otro.
6. Comprobar que cancelar no crea eventos y que sin portada se puede guardar, pero no publicar.
7. Ejecutar `pnpm --filter web exec tsc --noEmit` y `git diff --check`. Revisar el diff y obtener visto bueno antes de commit/push. No ejecutar build completo sin acordarlo.

## Diagnóstico observado el 20/09/2026

En `lookup1-web.vercel.app`, una petición a creación con token inválido devuelve 500 antes de procesar el formulario; el inicio de sesión del navegador funciona y las preferencias de eventos también fallan. Esto apunta a inicialización/conexión del cliente Supabase del servidor. No confirma por sí solo qué variable falta: comprobar logs/configuración de Vercel. No se ha desplegado ninguna corrección durante este trabajo.
