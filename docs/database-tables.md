# Tablas oficiales — LookUp

> Última actualización: Julio 2026

---

# Objetivo

Documentar la estructura conceptual de la base de datos y distinguir claramente entre las tablas implementadas y las planificadas.

La documentación debe reflejar siempre el estado real del proyecto.

---

# Tablas implementadas

## profiles

### Objetivo

Información principal del usuario.

Contiene la información necesaria para construir el perfil.

---

## profile_links

### Objetivo

Guardar las redes sociales y enlaces públicos del usuario.

### Información

- Instagram
- Facebook
- TikTok
- Página web
- Otros enlaces públicos

---

## profiles_public

### Objetivo

Información pública utilizada por el radar y los perfiles.

Nunca contiene datos sensibles.

---

## profiles_private

### Objetivo

Información privada del usuario.

Acceso únicamente mediante políticas RLS.

---

## user_locations

### Objetivo

Ubicación utilizada por el radar.

Contiene únicamente la información necesaria para localizar usuarios cercanos.

Nunca expone coordenadas exactas públicamente.

---

## location_presence

### Objetivo

Gestionar la presencia del usuario dentro del radar.

Información

- Estado
- Última actualización
- Radio de visibilidad

---

## privacy_settings

### Objetivo

Configuración de privacidad.

Permite controlar:

- Descubrimiento
- Visibilidad
- Modo invisible

---

## reports_blocks

### Objetivo

Moderación.

Permite registrar:

- Reportes
- Bloqueos

---

# Almacenamiento

## Bucket

avatars

Utilizado para almacenar las fotografías de perfil.

---

# Funciones SQL

## nearby_profiles()

Obtiene perfiles cercanos utilizando PostGIS.

---

## sync_user_location()

Actualiza la ubicación del usuario.

---

# Tablas planificadas

Las siguientes tablas forman parte de la hoja de ruta y sólo se crearán cuando sean necesarias.

---

## publications

Publicaciones creadas por los usuarios.

---

## publication_images

Imágenes asociadas a publicaciones.

---

## analytics_events

Analítica interna.

Permitirá medir:

- Retención
- Funnels
- Uso del radar
- Uso de publicaciones

---

## audit_logs

Auditoría interna.

Permitirá registrar acciones críticas del sistema.

---

## affinity_profiles

Resultados generados por el Affinity Engine.

Podrá almacenar información estructurada derivada del análisis del perfil.

Ejemplos:

- Categorías
- Habilidades
- Intereses normalizados
- Objetivos
- Afinidad calculada

Esta tabla será alimentada por IA cuando el usuario cree o modifique su perfil.

Nunca durante el uso del radar.

---

# Principios de la base de datos

- Mantener separada la información pública y privada.
- No duplicar información innecesariamente.
- Aprovechar PostgreSQL y PostGIS como núcleo del sistema.
- Utilizar RLS en toda información privada.
- Mantener el backend desacoplado del frontend.
- Toda ampliación deberá documentarse antes de implementarse.