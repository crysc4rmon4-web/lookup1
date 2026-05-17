# Flujo de datos oficial — LookUp

## Objetivo
Definir cómo viaja la información dentro del producto para mantener privacidad, orden y escalabilidad.

---

# 1. Flujo de autenticación

## Entrada
- email
- contraseña
- nombre real
- teléfono

## Proceso
1. el usuario crea cuenta
2. Supabase Auth valida credenciales
3. se crea el registro privado
4. se crea el perfil público mínimo
5. se registran consentimientos y aceptación de términos

## Salida
- sesión activa
- perfil inicial listo
- acceso al onboarding

---

# 2. Flujo de onboarding

## Entrada
- username
- foto
- bio
- profesión
- intereses
- links sociales
- preferencias de visibilidad

## Proceso
1. el usuario completa su perfil
2. se guarda información pública
3. se guardan preferencias privadas
4. se crea presencia inicial del radar
5. se registra evento interno de onboarding completado

## Salida
- perfil visible
- datos listos para radar y eventos

---

# 3. Flujo del radar

## Entrada
- ubicación aproximada
- estado visible/invisible
- radio permitido
- último movimiento

## Proceso
1. el móvil actualiza la presencia
2. el backend guarda ubicación aproximada
3. PostGIS calcula cercanía
4. se devuelven usuarios dentro del radio
5. solo se muestra información pública permitida

## Salida
- lista de personas cercanas
- distancia aproximada
- actualización visual del radar

---

# 4. Flujo de eventos

## Entrada
- título
- descripción
- categoría
- imagen
- ubicación
- horario
- creador

## Proceso
1. el usuario crea o interactúa con un evento
2. se guarda el evento en la base
3. se indexa por ubicación y categoría
4. se muestra en el mapa y en el listado
5. se registran interacciones internas

## Salida
- eventos visibles
- métricas de interacción
- contenido local útil

---

# 5. Flujo de analítica interna

## Entrada
- login
- visitas
- clicks
- búsquedas
- interacciones
- tiempo activo
- acciones del radar
- eventos creados
- links abiertos

## Proceso
1. cada acción relevante genera un evento interno
2. el evento se guarda con propiedades
3. el sistema agrega datos por usuario, zona y segmento
4. se construyen métricas de negocio
5. se generan insights para el equipo

## Salida
- funnels
- retención
- cohortes
- zonas calientes
- comportamiento por segmento

---

# 6. Flujo de privacidad

## Entrada
- consentimiento
- visibilidad
- ocultar teléfono
- ocultar ubicación
- modo invisible
- zonas bloqueadas

## Proceso
1. el usuario configura privacidad
2. el sistema guarda preferencias
3. RLS aplica restricciones de acceso
4. el radar respeta visibilidad
5. los datos públicos no exponen información privada

## Salida
- control del usuario
- protección de datos
- cumplimiento técnico

---

# 7. Flujo de moderación

## Entrada
- reporte
- bloqueo
- motivo
- cuenta afectada

## Proceso
1. el usuario reporta o bloquea
2. se guarda en reports_blocks
3. se registra en audit_logs
4. el sistema puede limitar exposición o acceso
5. el equipo revisa casos internos

## Salida
- seguridad
- trazabilidad
- control interno

---

# Principios del flujo

- nunca mezclar datos públicos y privados sin necesidad
- cada acción importante genera trazabilidad
- la privacidad se respeta por diseño
- la analítica vive separada del perfil
- el radar solo muestra lo permitido
- los eventos se usan para negocio, no para invadir privacidad