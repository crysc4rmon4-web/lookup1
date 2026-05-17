# Base de datos oficial — LookUp

# Filosofía

La base de datos de LookUp se divide en múltiples capas desacopladas para:

- proteger privacidad
- mejorar escalabilidad
- facilitar analítica
- evitar mezcla entre datos públicos y privados
- permitir crecimiento futuro sin caos técnico

---

# Stack oficial

- Supabase
- PostgreSQL 17
- PostGIS
- RLS obligatorio
- arquitectura modular

---

# Capas del sistema

## 1. Datos privados

Información sensible y operativa.

### Contendrá

- email
- teléfono
- nombre real
- fecha de nacimiento
- estado de cuenta
- aceptación de términos
- consentimientos
- timestamps

### Reglas

- nunca públicos por defecto
- acceso restringido mediante RLS
- visibles únicamente por propietario y sistema interno

---

## 2. Perfil público

Información visible dentro de la plataforma.

### Contendrá

- username
- nombre visible
- foto de perfil
- bio
- profesión
- intereses
- links sociales
- estado visible/invisible
- distancia aproximada

### Objetivo

Facilitar networking rápido y visual.

---

## 3. Sistema radar

Información geográfica temporal.

### Contendrá

- ubicación aproximada
- geohash
- radio de visibilidad
- last_seen
- estado online
- zonas ocultas

### Objetivo

Mostrar personas cercanas sin revelar ubicación exacta.

---

## 4. Eventos y negocios

Sistema de actividades y empresas.

### Contendrá

- nombre
- descripción
- categoría
- imágenes
- ubicación
- creador
- links
- métricas

---

## 5. Analítica interna

Sistema privado de negocio y comportamiento.

### Contendrá

- sesiones
- tiempo activo
- visitas perfil
- clicks
- búsquedas
- interacciones
- retención
- cohortes
- comportamiento agregado

### Objetivo

Entender crecimiento y comportamiento de usuarios.

---

# Principios técnicos

- privacidad por diseño
- minimización de datos
- evitar tablas gigantes
- evitar duplicación innecesaria
- separación de responsabilidades
- escalabilidad desde el inicio
- datos sensibles siempre opcionales
- consentimiento obligatorio
- ubicación exacta nunca pública

---

# Futuras tablas previstas

- profiles_private
- profiles_public
- privacy_settings
- consents
- location_presence
- events
- event_interactions
- analytics_events
- reports_blocks
- audit_logs