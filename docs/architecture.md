# LookUp — Architecture

> Última actualización: Julio 2026
> Estado: Arquitectura oficial del proyecto

---

# Objetivo

LookUp es una aplicación de networking presencial basada en geolocalización.

Su propósito es ayudar a descubrir personas cercanas con intereses afines y facilitar el acceso directo a sus redes sociales públicas.

LookUp no es una red social.

No pretende sustituir Instagram, LinkedIn, TikTok o cualquier otra plataforma.

Su función es descubrir personas relevantes y facilitar la conexión fuera de la aplicación.

---

# Principios de arquitectura

- Arquitectura modular y escalable.
- Monorepo con responsabilidades separadas.
- Reutilización antes que duplicación.
- Separación entre interfaz, lógica de negocio y acceso a datos.
- TypeScript estricto.
- Cada bloque funcional debe finalizar con un `pnpm build` limpio.

---

# Alcance del MVP

## Incluye

- Registro
- Login
- Onboarding
- Edición de perfil
- Perfil público
- Dashboard
- Radar inteligente
- Publicaciones
- Configuración básica

## No incluye

- Chat
- Feed social
- Stories
- Likes
- Comentarios
- Mensajes privados
- Seguidores
- Solicitudes de amistad
- Sistema de conexiones
- Notificaciones

La arquitectura queda preparada para incorporar estas funcionalidades en el futuro sin romper la estructura existente.

---

# Stack oficial

## Monorepo

- TurboRepo
- pnpm

## Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4

## Backend

- Supabase
- PostgreSQL
- PostGIS
- Storage
- Row Level Security (RLS)

---

# Estructura

```
apps/
    web/
    mobile/

packages/
    config/
    services/
    types/
    ui/
    utils/
```

---

# apps/web

```
app/
    (auth)/
    dashboard/
    onboarding/
    profile/

components/
hooks/
data/
lib/
```

---

# Dashboard

## Componentes

- DashboardHeader
- RadarView
- SettingsView
- BottomNav

## Hooks

- useRadar
- useProfileStatus
- useLocation
- useNearbyProfiles
- useSyncLocation

---

# Onboarding

Componentes reutilizables

- StepPhoto
- StepUsername
- StepName
- StepSocials
- StepBio
- StepInterests
- StepVisibility
- Navigation
- ProgressBar

El mismo flujo se reutiliza para editar el perfil.

---

# Base de datos

## Tablas principales

- profiles
- profile_links
- profiles_public
- profiles_private
- user_locations
- location_presence
- privacy_settings
- reports_blocks

---

# Storage

Bucket

- avatars

---

# Funciones SQL

- nearby_profiles()
- sync_user_location()

PostGIS permanece como motor geoespacial del proyecto.

---

# Radar

## Flujo

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

Affinity Engine

↓

Ranking

↓

RadarView

---

# Affinity Engine (MVP+)

El radar está preparado para integrar inteligencia artificial.

La IA nunca participa directamente durante la carga del radar.

Su función consiste en enriquecer el perfil del usuario cuando éste se crea o se modifica.

El motor calculará afinidad utilizando:

- intereses
- profesión
- objetivos
- biografía
- información pública

El resultado será una puntuación de afinidad utilizada por el radar para ordenar los perfiles.

---

# Descubrimiento de perfiles

LookUp no implementa solicitudes de amistad ni mensajería.

Cada perfil puede mostrar:

- Fotografía
- Nombre de usuario
- Biografía
- Intereses
- Redes sociales públicas
- Enlaces externos

El objetivo es facilitar el descubrimiento de personas y permitir que la conversación continúe directamente en las redes sociales del usuario.

---

# Publicaciones

Las publicaciones forman parte del MVP.

Permiten:

- Crear
- Descubrir
- Visualizar

No incluyen:

- Comentarios
- Reacciones
- Compartidos

---

# Reglas

- Nunca duplicar componentes.
- Nunca duplicar tablas existentes.
- Reutilizar antes de crear.
- Mantener la arquitectura del monorepo.
- Finalizar cada bloque con `pnpm build`.
- Finalizar cada funcionalidad con su correspondiente commit.
- Mantener la documentación sincronizada con el código.