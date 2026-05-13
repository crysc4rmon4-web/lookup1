# Stack oficial del proyecto

## Objetivo del stack

Construir una plataforma social moderna, escalable, reutilizable y preparada para crecimiento rápido en web y mobile, manteniendo una sola arquitectura consistente.

---

# Runtime y tooling

## Node.js 22.14.0 (LTS)

### ¿Qué es?
Entorno de ejecución principal del proyecto.

### ¿Por qué se eligió?
- versión LTS estable
- compatibilidad con Next.js 15
- compatibilidad con Expo SDK 53
- estabilidad para monorepos
- soporte moderno del ecosistema

### Regla oficial
No utilizar versiones experimentales o no validadas para evitar incompatibilidades futuras.

---

## pnpm 10

### ¿Qué es?
Package manager oficial del proyecto.

### ¿Por qué se eligió?
- mejor rendimiento
- mejor manejo de monorepos
- instalación más rápida
- dependencias más limpias
- menor consumo de espacio

### Uso dentro del proyecto
- instalación de dependencias
- workspaces
- gestión del monorepo

---

## Turborepo 2

### ¿Qué es?
Sistema de orquestación para monorepos modernos.

### ¿Por qué se eligió?
- caching inteligente
- builds rápidas
- organización profesional
- escalabilidad empresarial

### Uso dentro del proyecto
- coordinación entre apps
- pipelines
- builds
- desarrollo compartido

---

# Web

## Next.js 15.3.2

### ¿Qué es?
Framework moderno basado en React para aplicaciones web escalables.

### ¿Por qué se eligió?
- App Router moderno
- excelente rendimiento
- Server Components
- SEO optimizado
- escalabilidad empresarial
- gran ecosistema
- ideal para plataformas híbridas modernas

### Uso dentro del proyecto
- aplicación web principal
- rendering híbrido
- navegación
- server actions
- APIs internas

---

## React 19.1.0

### ¿Qué es?
Librería principal para construir interfaces modernas.

### ¿Por qué se eligió?
- ecosistema dominante
- compatibilidad enorme
- reutilización
- rendimiento
- base compartida con React Native

### Uso dentro del proyecto
- UI
- componentes
- estados
- arquitectura visual

---

## TypeScript 5.8.3

### ¿Qué es?
Superset tipado de JavaScript.

### ¿Por qué se eligió?
- reduce errores
- facilita escalabilidad
- mejora mantenibilidad
- hace el código más profesional
- mejor experiencia de desarrollo

### Reglas importantes
- strict mode obligatorio
- prohibido usar any

---

## Tailwind CSS 4.1.7

### ¿Qué es?
Framework utility-first de estilos.

### ¿Por qué se eligió?
- velocidad de desarrollo
- consistencia visual
- diseño moderno
- reutilización
- excelente integración con React

### Uso dentro del proyecto
- estilos globales
- layout
- sistema visual

---

## shadcn/ui

### ¿Qué es?
Sistema moderno de componentes reutilizables.

### ¿Por qué se eligió?
- componentes desacoplados
- alta personalización
- calidad visual premium
- accesibilidad integrada

### Uso dentro del proyecto
- componentes base
- formularios
- modales
- inputs
- menús
- diálogos

---

# Mobile

## Expo SDK 53

### ¿Qué es?
Plataforma moderna para React Native.

### ¿Por qué se eligió?
- desarrollo rápido
- gran ecosistema
- soporte nativo moderno
- facilidad de despliegue
- excelente DX

### Uso dentro del proyecto
- aplicación móvil
- builds Android/iOS
- acceso a hardware
- geolocalización

---

## React Native 0.79

### ¿Qué es?
Framework para aplicaciones móviles nativas usando React.

### ¿Por qué se eligió?
- rendimiento nativo
- ecosistema maduro
- compatibilidad con React
- experiencia móvil moderna

### Uso dentro del proyecto
- interfaz móvil
- navegación
- animaciones
- experiencia táctil

---

## NativeWind 4

### ¿Qué es?
Adaptación de Tailwind CSS para React Native.

### ¿Por qué se eligió?
- consistencia visual entre web y mobile
- reutilización mental del sistema de estilos
- velocidad de desarrollo
- integración moderna con Expo

### Uso dentro del proyecto
- estilos mobile
- diseño consistente
- componentes reutilizables

---

# Backend

## Supabase

### ¿Qué es?
Backend-as-a-Service moderno basado en PostgreSQL.

### ¿Por qué se eligió?
- autenticación integrada
- realtime
- PostgreSQL nativo
- velocidad de desarrollo
- excelente integración con TypeScript

### Uso dentro del proyecto
- auth
- base de datos
- realtime
- storage
- APIs iniciales

---

## PostgreSQL 17

### ¿Qué es?
Base de datos relacional avanzada.

### ¿Por qué se eligió?
- estabilidad
- rendimiento
- escalabilidad
- compatibilidad con PostGIS
- estándar empresarial

### Uso dentro del proyecto
- almacenamiento principal de datos

---

## PostGIS

### ¿Qué es?
Extensión geoespacial para PostgreSQL.

### ¿Por qué se eligió?
- cálculos geográficos avanzados
- búsquedas por proximidad
- optimización espacial
- escalabilidad para radar geográfico

### Uso dentro del proyecto
- radar de usuarios cercanos
- cálculo de distancias
- geolocalización avanzada

---

# Arquitectura

## Monorepo

### ¿Qué es?
Estructura centralizada para compartir código entre web y mobile.

### ¿Por qué se eligió?
- reutilización
- consistencia
- mantenimiento simplificado
- escalabilidad

### Uso dentro del proyecto
- compartir tipos
- compartir lógica
- compartir configuración
- compartir componentes

---

# Principios técnicos oficiales

- TypeScript estricto
- mobile-first
- arquitectura modular
- componentes reutilizables
- separación de responsabilidades
- clean architecture
- performance primero
- accesibilidad obligatoria
- evitar sobreingeniería
- escalabilidad desde el inicio
- privacidad del usuario como prioridad
- geolocalización optimizada