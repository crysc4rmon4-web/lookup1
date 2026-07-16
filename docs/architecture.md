# LookUp — Architecture

> Última actualización: Julio 2026

---

# Objetivo

LookUp es una aplicación de networking presencial.

No es una red social.

Su propósito es descubrir personas y eventos cercanos utilizando la ubicación GPS.

---

# MVP

El MVP incluye únicamente:

- Registro / Login
- Onboarding
- Perfil público
- Radar
- Eventos
- Configuración
- Conexiones

NO incluye:

- Chat
- Feed
- Stories
- Likes
- Comentarios
- Mensajes privados

La arquitectura permitirá añadir chat en el futuro sin modificar el resto del sistema.

---

# Stack

Monorepo

TurboRepo

pnpm

Next.js 15

React 19

TypeScript

Tailwind CSS v4

Supabase

PostgreSQL

PostGIS

---

# Estructura

apps/

web/

mobile/

packages/

services/

ui/

types/

config/

utils/

---

# apps/web

app/

dashboard/

onboarding/

profile/

(auth)/

components/

hooks/

data/

lib/

---

# Dashboard

Componentes

DashboardHeader

RadarView

EventsView

SettingsView

BottomNav

Hooks

useRadar

useProfileStatus

useLocation

useNearbyProfiles

useSyncLocation

---

# Onboarding

StepPhoto

StepUsername

StepName

StepSocials

StepBio

StepInterests

StepVisibility

Navigation

ProgressBar

---

# Base de datos

Tablas existentes

profiles

profile_links

profiles_public

profiles_private

user_locations

location_presence

connections

events

privacy_settings

reports_blocks

---

# Storage

Bucket

avatars

---

# Funciones SQL

nearby_profiles()

sync_user_location()

PostGIS activo

---

# Radar

Flujo

Usuario

↓

GPS

↓

useLocation()

↓

updateMyLocation()

↓

user_locations

↓

nearby_profiles()

↓

profiles

↓

RadarView

---

# Eventos

Los eventos son independientes del radar.

Cada evento pertenece a un usuario.

Los usuarios podrán:

crear

descubrir

apuntarse

---

# Conexiones

Las conexiones sustituyen al chat.

Un usuario puede:

Conectar

Aceptar

Rechazar

Bloquear

En el MVP no existe mensajería.

---

# Reglas

Nunca crear archivos duplicados.

Nunca crear tablas existentes.

Cada bloque debe terminar con

pnpm build

Cada bloque funcional termina con

git commit

Nunca mezclar arquitectura antigua y nueva.

Siempre entregar archivos completos cuando cambien.
