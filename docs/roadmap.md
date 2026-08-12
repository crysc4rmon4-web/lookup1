# Roadmap oficial — LookUp

> Última actualización: Julio 2026

---

# Objetivo

Construir una herramienta de descubrimiento social basada en proximidad geográfica que permita conectar personas mediante sus redes sociales públicas.

El desarrollo seguirá un enfoque incremental, validando primero el núcleo del producto antes de incorporar funcionalidades avanzadas.

---

# Estado actual

## Documentación

Estado: ✅ Completada

Incluye:

- Arquitectura
- Stack oficial
- Convenciones
- Base de datos
- Flujo de datos
- MVP
- Roadmap
- IA
- Decisiones técnicas

---

## Infraestructura

Estado: ✅ Completada

Incluye:

- Monorepo
- Turborepo
- pnpm
- Next.js
- Expo
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- PostGIS
- Storage
- Configuración compartida

---

## Core del producto

Estado: 🟡 En desarrollo

Incluye:

- Autenticación
- Onboarding
- Dashboard
- Perfil público
- Edición de perfil
- Navegación
- Providers
- Sistema de diseño

Objetivo:

Disponer de una base estable sobre la que construir el radar.

---

# Fase 1 — Radar

Objetivo

Construir el núcleo del producto.

Incluye:

- Geolocalización
- Actualización de ubicación
- Detección de personas cercanas
- Ranking
- Visualización del radar
- Optimización con PostGIS
- Realtime

Resultado esperado

Usuarios descubriendo personas cercanas en tiempo real.

---

# Fase 2 — Publicaciones

Objetivo

Aumentar el valor del descubrimiento.

Incluye:

- Crear publicaciones
- Mostrar publicaciones
- Relacionarlas con perfiles
- Descubrimiento local

Resultado esperado

Contenido generado por los usuarios sin convertir la aplicación en una red social.

---

# Fase 3 — Affinity Engine (MVP+)

Objetivo

Ordenar los perfiles por afinidad.

Incluye:

- Enriquecimiento del perfil
- Clasificación de intereses
- Normalización
- Ranking inteligente
- Preparación para IA

Resultado esperado

El radar deja de ordenar únicamente por distancia y comienza a priorizar personas relevantes.

---

# Fase 4 — Refinamiento UX/UI

Objetivo

Mejorar la experiencia general.

Incluye:

- Animaciones
- Microinteracciones
- Optimización mobile
- Accesibilidad
- Rendimiento
- Consistencia visual

---

# Fase 5 — Testing

Objetivo

Garantizar estabilidad.

Incluye:

- Testing funcional
- Casos límite
- Validaciones
- Corrección de errores
- Optimización

---

# Fase 6 — Deploy

Objetivo

Publicar la primera versión utilizable.

Incluye:

- Web
- Android
- iOS
- Variables de producción
- Monitorización
- Analítica

---

# Versiones futuras

Una vez validado el MVP podrán incorporarse nuevas funcionalidades.

Posibles líneas de evolución:

- Eventos
- Negocios locales
- Promociones geolocalizadas
- IA avanzada
- Recomendaciones inteligentes
- Marketplace
- Monetización

Estas funcionalidades no forman parte del MVP actual.

---

# Filosofía

- Construir primero el núcleo.
- Validar antes de ampliar.
- No competir con las redes sociales.
- Priorizar simplicidad.
- Mantener una arquitectura escalable.
- Documentar antes de implementar.
