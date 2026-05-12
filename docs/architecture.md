# Arquitectura del proyecto

Este proyecto se construirá como un monorepo para compartir lógica, tipos, componentes y configuración entre web y mobile.

## Estructura base

- `apps/web`: aplicación web
- `apps/mobile`: aplicación móvil
- `packages/ui`: componentes compartidos
- `packages/types`: tipos compartidos
- `packages/config`: configuración central
- `packages/utils`: utilidades puras
- `packages/services`: acceso a API y lógica de integración

## Principios

- separar UI, lógica y datos
- reutilizar al máximo
- mantener el código limpio y escalable
- evitar duplicación
- priorizar mantenibilidad