# Convenciones oficiales del proyecto

## Objetivo

Mantener un código consistente, reutilizable, escalable y fácil de mantener tanto para la aplicación web como para la aplicación móvil.

Estas convenciones son de obligado cumplimiento durante todo el desarrollo.

---

# Principios generales

- Utilizar TypeScript estricto.
- Evitar duplicación.
- Priorizar claridad sobre complejidad.
- Separar interfaz, lógica de negocio y acceso a datos.
- Diseñar componentes reutilizables.
- Mantener archivos pequeños y con una única responsabilidad.
- Pensar siempre en Mobile First.
- Mantener consistencia visual y técnica.

---

# Convenciones de nombres

## Archivos

Utilizar `kebab-case`

Ejemplos

- user-profile.tsx
- auth-service.ts
- update-profile.ts

---

## Componentes

Utilizar `PascalCase`

Ejemplos

- UserCard
- RadarCard
- ProfileHeader

---

## Variables y funciones

Utilizar `camelCase`

Ejemplos

- userName
- updateProfile
- getNearbyProfiles

---

## Constantes

Utilizar `UPPER_SNAKE_CASE`

Ejemplos

- MAX_RADIUS_METERS
- DEFAULT_AVATAR
- ONBOARDING_STEPS

---

# Organización

## Apps

- apps/web
- apps/mobile

## Packages

- config
- services
- types
- ui
- utils

Cada paquete debe tener una única responsabilidad claramente definida.

---

# Reglas de código

- No utilizar `any`.
- No duplicar tipos.
- No mezclar lógica de negocio con componentes visuales.
- No almacenar secretos en el código.
- No crear funciones excesivamente largas.
- No introducir dependencias sin justificación.
- Reutilizar componentes antes de crear nuevos.

---

# Reglas para componentes

Cada componente debe:

- Tener una única responsabilidad.
- Estar correctamente tipado.
- Ser reutilizable.
- Mantener una API sencilla mediante props.
- Evitar dependencias innecesarias.

---

# Reglas para servicios

Los servicios deben:

- Encapsular el acceso a Supabase.
- No contener lógica de presentación.
- Ser reutilizables.
- Mantener nombres consistentes.

---

# Reglas para la IA

Toda respuesta generada para este proyecto debe:

- Consultar primero la documentación oficial del proyecto.
- Respetar la arquitectura existente.
- No modificar estructuras sin justificación.
- No renombrar archivos o componentes sin necesidad.
- No introducir sobreingeniería.
- Entregar siempre archivos completos cuando exista una modificación.
- Priorizar el alcance definido en `MVP.md`.
- Reutilizar componentes y servicios existentes antes de crear nuevos.

---

# Flujo obligatorio de trabajo

Cada bloque debe seguir este orden:

1. Revisar la documentación del proyecto.
2. Implementar una única funcionalidad completa.
3. Ejecutar `pnpm build`.
4. Corregir cualquier error.
5. Realizar commit.
6. Actualizar la documentación si cambia el estado del proyecto.

---

# Criterio de calidad

Un bloque se considera terminado cuando:

- Compila correctamente.
- Supera TypeScript.
- Mantiene la arquitectura.
- No rompe funcionalidades existentes.
- Es reutilizable.
- Está documentado.

---

# Fuente oficial de verdad

La documentación del directorio `docs/` constituye la fuente oficial de conocimiento del proyecto.

Antes de implementar cualquier funcionalidad, modificar una existente o proponer cambios de arquitectura, debe consultarse dicha documentación.

Si una decisión cambia, primero se actualiza la documentación y después se modifica el código.