# Flujo oficial de datos — LookUp

> Última actualización: Julio 2026

---

# Objetivo

Definir cómo viaja la información dentro de LookUp para mantener una arquitectura clara, escalable y respetuosa con la privacidad.

Todos los flujos deben mantener separada la información pública de la información privada.

---

# 1. Flujo de autenticación

## Entrada

- Email
- Contraseña

## Proceso

1. El usuario crea una cuenta.
2. Supabase Auth valida las credenciales.
3. Se crea el usuario autenticado.
4. Se generan los registros iniciales del perfil.
5. Se inicia la sesión.
6. El usuario es redirigido al onboarding.

## Salida

- Sesión activa.
- Perfil inicial creado.
- Acceso al onboarding.

---

# 2. Flujo de onboarding

## Entrada

- Username
- Fotografía
- Nombre
- Biografía
- Profesión
- Intereses
- Redes sociales
- Preferencias de visibilidad

## Proceso

1. El usuario completa su perfil.
2. Se guarda la información pública.
3. Se guardan las preferencias privadas.
4. Se crea la presencia inicial en el radar.
5. Se ejecuta el Affinity Engine.
6. El perfil queda enriquecido para futuras búsquedas.

## Salida

- Perfil público.
- Perfil privado.
- Perfil preparado para el radar inteligente.

---

# 3. Flujo del radar

## Entrada

- Ubicación aproximada.
- Estado visible.
- Radio permitido.

## Proceso

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

Affinity Engine Score

↓

Ranking

↓

RadarView

## Salida

- Personas cercanas.
- Distancia aproximada.
- Afinidad calculada.
- Acceso al perfil público.

---

# 4. Flujo de publicaciones

## Entrada

- Título
- Descripción
- Categoría
- Imagen (opcional)

## Proceso

1. El usuario crea una publicación.
2. Se guarda en Supabase.
3. Se relaciona con el perfil del usuario.
4. Se muestra en el dashboard y en el radar cuando corresponda.

## Salida

- Publicación disponible.
- Visible según configuración de privacidad.

---

# 5. Flujo del Affinity Engine (MVP+)

## Entrada

Información pública del perfil

- Biografía
- Profesión
- Intereses
- Redes sociales públicas

## Proceso

1. El usuario crea o actualiza su perfil.
2. Se ejecuta el proceso de enriquecimiento.
3. La IA analiza únicamente la información pública.
4. Se generan atributos estructurados.
5. Se calcula una puntuación de afinidad.
6. Se almacenan los resultados.

## Salida

- Perfil enriquecido.
- Afinidad disponible para el radar.

La IA nunca se ejecuta cuando un usuario abre el radar.

---

# 6. Flujo de privacidad

## Entrada

- Visibilidad
- Modo invisible
- Permitir descubrimiento

## Proceso

1. El usuario configura la privacidad.
2. Supabase almacena la configuración.
3. Las políticas RLS controlan el acceso.
4. El radar únicamente muestra perfiles autorizados.
5. La IA sólo procesa información pública.

## Salida

- Privacidad garantizada.
- Descubrimiento controlado.

---

# 7. Flujo de moderación

## Entrada

- Reporte
- Bloqueo
- Motivo

## Proceso

1. El usuario reporta un perfil.
2. Se registra el incidente.
3. El sistema limita la visibilidad cuando corresponda.
4. El equipo revisa el caso.

## Salida

- Plataforma más segura.
- Historial de moderación.

---

# Principios oficiales

- Nunca mezclar datos públicos y privados.
- La privacidad se respeta por diseño.
- El radar únicamente muestra información autorizada.
- La IA nunca procesa información privada.
- La IA trabaja durante la creación o edición del perfil, nunca durante la búsqueda.
- Supabase es la única fuente de datos.
- PostgreSQL almacena la información.
- PostGIS gestiona la geolocalización.
- Next.js y Expo comparten la mayor cantidad posible de lógica.
- Turborepo centraliza la arquitectura del proyecto.