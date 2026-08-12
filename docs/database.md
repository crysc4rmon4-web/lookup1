# Base de datos oficial — LookUp

> Última actualización: Julio 2026

---

# Objetivo

La base de datos de LookUp está diseñada para ofrecer una arquitectura segura, modular y escalable.

Su objetivo es mantener completamente separadas la información pública, la información privada, la geolocalización y los datos internos del sistema.

La estructura está preparada para crecer sin necesidad de rediseñar el backend.

---

# Stack oficial

- Supabase
- PostgreSQL 17
- PostGIS
- Storage
- Row Level Security (RLS)

---

# Principios de diseño

La arquitectura de la base de datos sigue estos principios:

- Privacidad por diseño.
- Separación entre datos públicos y privados.
- Reutilización antes que duplicación.
- Escalabilidad horizontal.
- Consultas optimizadas para geolocalización.
- Seguridad mediante políticas RLS.
- Arquitectura preparada para IA.

---

# Capas de información

## 1. Datos privados

Información exclusiva del propietario.

Ejemplos

- correo electrónico
- nombre real
- información sensible
- configuración interna

Nunca puede ser utilizada por el radar.

---

## 2. Perfil público

Información visible para otros usuarios.

Ejemplos

- fotografía
- username
- biografía
- profesión
- intereses
- enlaces públicos

Esta información alimenta el radar y el Affinity Engine.

---

## 3. Geolocalización

Información temporal utilizada por el radar.

Incluye

- ubicación aproximada
- radio de visibilidad
- estado
- última actualización

Nunca se muestran coordenadas exactas.

---

## 4. Publicaciones

Información generada por los usuarios.

Incluye

- publicaciones
- imágenes
- metadatos

Siempre asociadas a un perfil.

---

## 5. Inteligencia (MVP+)

LookUp incorpora una capa de enriquecimiento mediante IA.

La IA nunca modifica directamente los perfiles visibles.

Su función consiste en analizar la información pública del usuario cuando éste crea o actualiza su perfil.

El resultado se almacena para acelerar el funcionamiento del radar.

---

## 6. Analítica

Información exclusivamente interna.

Permite conocer:

- uso del radar
- uso de publicaciones
- retención
- comportamiento agregado

Nunca interviene en la experiencia del usuario.

---

# Seguridad

Toda la información privada se protege mediante Row Level Security (RLS).

Las consultas públicas únicamente pueden acceder a la información expresamente permitida.

La ubicación exacta nunca será visible para otros usuarios.

La IA únicamente podrá procesar información pública.

---

# Filosofía del sistema

La base de datos no está diseñada únicamente para almacenar información.

Está diseñada para:

- proteger la privacidad
- facilitar el descubrimiento de personas
- escalar con miles de usuarios
- permitir incorporar nuevas funcionalidades sin modificar la arquitectura existente

Las tablas concretas y su estructura se documentan en `DATABASE-TABLES.md`.
