# Stack oficial del proyecto

## Objetivo del stack

Construir una plataforma social moderna, escalable, reutilizable y preparada para crecimiento rápido en web y mobile, manteniendo una sola arquitectura consistente.

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

## Turborepo
### ¿Qué es?
Sistema moderno para manejar monorepos.

### ¿Por qué se eligió?
- compartir código
- builds optimizadas
- escalabilidad
- organización profesional

### Uso dentro del proyecto
- gestión del monorepo
- caching
- pipelines

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