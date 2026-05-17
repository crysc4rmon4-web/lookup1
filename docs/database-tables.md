# Tablas oficiales — LookUp

# Objetivo

Definir la estructura conceptual oficial de las tablas del sistema.

---

# Tabla: profiles_private

## Objetivo

Guardar información privada y sensible de la cuenta.

## Contendrá

- id
- auth_user_id
- email
- phone
- real_name
- birth_date
- account_status
- created_at
- updated_at

## Reglas

- nunca pública
- protegida mediante RLS
- acceso exclusivo del propietario

---

# Tabla: profiles_public

## Objetivo

Perfil visible dentro de la plataforma.

## Contendrá

- id
- username
- display_name
- avatar_url
- bio
- profession
- interests
- visibility_status
- created_at

## Reglas

- visible públicamente dentro del sistema
- nunca contener datos sensibles

---

# Tabla: profile_links

## Objetivo

Guardar redes sociales y links externos.

## Contendrá

- id
- profile_id
- instagram_url
- tiktok_url
- facebook_url
- website_url

---

# Tabla: privacy_settings

## Objetivo

Controlar privacidad y visibilidad.

## Contendrá

- id
- profile_id
- invisible_mode
- hide_phone
- hide_location
- allow_discovery
- allow_event_visibility

---

# Tabla: location_presence

## Objetivo

Sistema radar y presencia geográfica.

## Contendrá

- id
- profile_id
- geohash
- location
- visibility_radius
- last_seen
- online_status

## Reglas

- nunca mostrar coordenadas exactas públicamente
- optimizada para PostGIS

---

# Tabla: events

## Objetivo

Eventos, actividades y negocios.

## Contendrá

- id
- creator_id
- title
- description
- category
- cover_image
- location
- starts_at
- ends_at
- visibility
- created_at

---

# Tabla: event_interactions

## Objetivo

Interacciones de usuarios con eventos.

## Contendrá

- id
- event_id
- profile_id
- interaction_type
- created_at

---

# Tabla: analytics_events

## Objetivo

Sistema interno de analítica y comportamiento.

## Contendrá

- id
- profile_id
- event_name
- event_data
- device_info
- session_id
- created_at

## Objetivo técnico

- funnels
- cohortes
- retención
- métricas internas
- comportamiento agregado

---

# Tabla: reports_blocks

## Objetivo

Moderación y seguridad.

## Contendrá

- id
- reporter_id
- target_profile_id
- reason
- status
- created_at

---

# Tabla: audit_logs

## Objetivo

Auditoría interna del sistema.

## Contendrá

- id
- action_type
- actor_id
- metadata
- created_at