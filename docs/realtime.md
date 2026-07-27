# Sistema de tiempo real — LookUp

> Última actualización: Julio 2026

---

# Objetivo

Definir qué partes de LookUp utilizan comunicación en tiempo real y bajo qué condiciones.

El uso de tiempo real debe ser selectivo para mantener un consumo eficiente de batería, red y recursos del servidor.

---

# Principios

- Utilizar tiempo real únicamente cuando aporte valor al usuario.
- Evitar actualizaciones innecesarias.
- Priorizar eficiencia sobre frecuencia.
- Mantener una experiencia fluida.

---

# Funcionalidades en tiempo real

## Radar

El radar es el principal consumidor de tiempo real.

Actualiza:

- Presencia de usuarios.
- Cambios de visibilidad.
- Ubicación aproximada.
- Aparición o desaparición de perfiles cercanos.

---

## Estado del usuario

Cada usuario puede encontrarse en uno de los siguientes estados:

- Visible.
- Invisible.
- Desconectado.

Estos estados determinan si el perfil puede aparecer en el radar.

---

## Actualización de ubicación

La ubicación se sincroniza únicamente cuando es necesario.

Ejemplos:

- Cambio significativo de posición.
- Apertura del radar.
- Reanudación de la aplicación.

No se busca un seguimiento continuo de alta frecuencia.

---

## Publicaciones

Las nuevas publicaciones podrán aparecer sin necesidad de recargar la aplicación cuando el usuario se encuentre dentro de la zona correspondiente.

---

# Funcionalidades que no utilizan tiempo real

Durante el MVP no requieren comunicación en tiempo real:

- Inicio de sesión.
- Onboarding.
- Edición del perfil.
- Consulta del perfil.
- Configuración.

---

# Tecnología

El tiempo real se implementa mediante las capacidades de Supabase Realtime.

La lógica de negocio permanece desacoplada de la tecnología utilizada, permitiendo sustituir el proveedor en el futuro si fuese necesario.

---

# Escalabilidad

La arquitectura debe permitir:

- Incrementar el número de usuarios concurrentes.
- Reducir el tráfico innecesario.
- Mantener un consumo eficiente de recursos.
- Incorporar nuevas funcionalidades en tiempo real sin modificar la arquitectura principal.

---

# Principios finales

- El radar es el núcleo del sistema en tiempo real.
- La ubicación exacta nunca se expone públicamente.
- El tiempo real debe utilizarse únicamente cuando mejore la experiencia del usuario.
- La privacidad prevalece sobre la inmediatez.