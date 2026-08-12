# Stack oficial — LookUp

> Última actualización: Julio 2026

---

# Objetivo

Mantener un stack moderno, estable y compartido entre web y móvil, priorizando la reutilización, la escalabilidad y la simplicidad.

---

# Runtime

## Node.js

Versión LTS oficial del proyecto.

Uso:

- Desarrollo
- Builds
- Scripts
- Herramientas

---

## pnpm

Package manager oficial.

Uso:

- Dependencias
- Workspaces
- Monorepo

---

## Turborepo

Orquestador del monorepo.

Uso:

- Builds
- Caché
- Compartición de paquetes
- Desarrollo conjunto

---

# Web

## Next.js 15

Framework principal.

Uso:

- Aplicación web
- App Router
- Server Components
- Server Actions
- Rendering híbrido

---

## React 19

Biblioteca principal de interfaz.

Uso:

- Componentes
- Hooks
- Estados
- Renderizado

---

## TypeScript

Modo estricto obligatorio.

Reglas:

- `strict: true`
- Prohibido utilizar `any`
- Tipado compartido entre web y móvil

---

## Tailwind CSS v4

Sistema oficial de estilos.

Uso:

- Layout
- Componentes
- Responsive
- Diseño visual

---

## shadcn/ui

Biblioteca de componentes base.

Uso:

- Formularios
- Inputs
- Modales
- Menús
- Componentes reutilizables

---

# Mobile

## Expo

Framework oficial para la aplicación móvil.

Uso:

- Android
- iOS
- Acceso a hardware
- Geolocalización

---

## React Native

Base de la aplicación móvil.

Uso:

- Componentes nativos
- Navegación
- Interacción táctil

---

## NativeWind

Sistema de estilos para React Native.

Objetivo:

Mantener consistencia visual entre web y móvil.

---

# Backend

## Supabase

Backend principal.

Uso:

- Auth
- PostgreSQL
- Storage
- Realtime
- Edge Functions (cuando sean necesarias)

---

## PostgreSQL

Base de datos principal.

Uso:

- Información pública
- Información privada
- Publicaciones
- Configuración

---

## PostGIS

Motor geoespacial.

Uso:

- Radar
- Distancias
- Consultas geográficas

---

## Storage

Uso:

- Avatares
- Imágenes de publicaciones
- Recursos públicos

---

# Arquitectura

## Monorepo

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

Objetivo:

- Compartir código.
- Compartir tipos.
- Compartir configuración.
- Compartir componentes.

---

# Principios técnicos

- Mobile First.
- TypeScript estricto.
- Arquitectura modular.
- Componentes reutilizables.
- Separación de responsabilidades.
- Clean Architecture.
- Performance como prioridad.
- Accesibilidad.
- Privacidad por diseño.
- Escalabilidad desde el inicio.

---

# Regla oficial

Las versiones concretas de cada dependencia se definen en los archivos `package.json`.

Este documento describe únicamente las tecnologías oficiales del proyecto.

La actualización de versiones deberá realizarse directamente en el código y reflejarse posteriormente en la documentación cuando implique un cambio de tecnología o arquitectura.
