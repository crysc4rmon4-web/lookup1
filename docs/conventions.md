# Convenciones oficiales del proyecto

## Objetivo
Mantener el código consistente, legible, escalable y fácil de mantener en web y mobile.

---

## Principios generales

- usar TypeScript estricto
- evitar duplicación
- priorizar claridad sobre ingenio
- mantener separación entre UI, lógica y datos
- escribir código reutilizable
- evitar archivos gigantes
- evitar dependencias innecesarias
- pensar en mobile first
- mantener consistencia visual y técnica

---

## Reglas de nombres

### Archivos
- usar `kebab-case` para archivos y carpetas
- ejemplo: `user-profile.tsx`, `auth-service.ts`

### Componentes
- usar `PascalCase`
- ejemplo: `UserCard`, `RadarButton`

### Variables y funciones
- usar `camelCase`
- ejemplo: `userName`, `getNearbyUsers`

### Constantes
- usar `UPPER_SNAKE_CASE`
- ejemplo: `MAX_RADIUS_METERS`

---

## Estructura de carpetas

### Apps
- `apps/web`: aplicación web
- `apps/mobile`: aplicación móvil

### Packages
- `packages/ui`: componentes compartidos
- `packages/types`: tipos compartidos
- `packages/config`: configuración central
- `packages/utils`: utilidades puras
- `packages/services`: acceso a servicios y APIs

---

## Reglas de código

- no usar `any`
- no mezclar lógica de negocio dentro de componentes visuales
- no duplicar tipos
- no hardcodear secretos
- no crear funciones demasiado grandes
- no crear componentes sin propósito claro
- no introducir librerías sin justificación

---

## Reglas de diseño de componentes

- un componente = una responsabilidad principal
- preferir composición sobre herencia
- separar presentación de comportamiento
- reutilizar antes de crear nuevo
- mantener props limpias y tipadas

---

## Reglas para la IA

Cuando el GPT genere código:
- debe respetar estas convenciones
- debe explicar cualquier excepción
- no debe improvisar estructuras distintas
- no debe cambiar nombres sin motivo
- no debe introducir soluciones sobredimensionadas

---

## Criterio de calidad

Un archivo está bien si:
- se entiende rápido
- se puede reutilizar
- no rompe otras partes
- no depende de suposiciones ocultas
- es fácil de mantener dentro de 6 meses
