# LookUp

> Aplicación de networking basada en geolocalización para conectar personas cercanas mediante sus perfiles y redes sociales.

---

# 📖 Descripción

LookUp es una aplicación de networking cuyo objetivo es facilitar conexiones entre personas que se encuentran físicamente cerca.

La idea surge de una situación muy común: muchas oportunidades personales y profesionales nunca llegan a producirse simplemente porque las personas no saben quién tienen alrededor.

LookUp permite descubrir perfiles cercanos, conocer sus intereses y acceder a sus redes sociales o métodos de contacto para facilitar una conexión de forma sencilla y natural.

---

# 🚀 Objetivo del MVP

El objetivo del MVP es validar una plataforma capaz de:

- Registrar usuarios.
- Gestionar autenticación.
- Crear y editar perfiles.
- Descubrir personas cercanas mediante geolocalización.
- Visualizar perfiles públicos.
- Publicar intereses u oportunidades.
- Facilitar el contacto mediante redes sociales.

---

# ✨ Funcionalidades

## Autenticación

- Registro de usuarios
- Inicio de sesión
- Cierre de sesión
- Verificación por correo electrónico

## Perfil

- Creación de perfil
- Edición de perfil
- Avatar
- Biografía
- Redes sociales
- Intereses

## Networking

- Descubrimiento de usuarios cercanos
- Visualización de perfiles públicos
- Acceso a redes sociales

## Publicaciones

- Crear publicaciones
- Visualizar publicaciones cercanas

---

# 🛠 Stack tecnológico

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- PostgreSQL RPC

## Arquitectura

- Turborepo
- pnpm

## Deploy

- Vercel
- Supabase Cloud

---

# 📂 Arquitectura del proyecto

```
lookup1/

apps/
│
├── web/
└── mobile/

packages/
│
├── ui/
├── services/
├── types/
├── utils/
└── config/

docs/

README.md
```

---

# 📚 Documentación

Toda la documentación técnica se encuentra dentro de la carpeta **docs/**.

Actualmente incluye:

- Arquitectura
- Stack tecnológico
- Base de datos
- Flujo de datos
- Roadmap
- Sistema de diseño
- Convenciones del proyecto

---

# ⚙️ Instalación

Instalar dependencias

```bash
pnpm install
```

Iniciar entorno de desarrollo

```bash
pnpm dev
```

---

# 📌 Estado del proyecto

Actualmente el proyecto se encuentra en fase de desarrollo del MVP.

## Módulos completados

- Infraestructura
- Arquitectura del proyecto
- Autenticación
- Onboarding
- Dashboard
- Protección de rutas

## Próximos módulos

- Edición de perfil
- Radar de usuarios
- Publicaciones
- Diseño final
- Despliegue del MVP

---

# 🎯 Roadmap

## MVP

- Perfil editable
- Radar
- Publicaciones
- Diseño
- Beta

## Futuras versiones

- Chat
- Notificaciones
- Eventos
- Recomendaciones mediante IA
- Funciones Premium

---

# 👨‍💻 Autor

Crystian Carmona

Proyecto desarrollado como parte de un proceso de aprendizaje Full Stack y con el objetivo de construir un producto real listo para producción.