# Vocali Transcriber

## Objetivo

La empresa Vocali se encuentra construyendo un servicio en la nube que permita a los usuarios registrados realizar transcripciones de audio.

La plataforma contará con las siguientes opciones:

- **Registrarse en la plataforma**: permite darse de alta en la plataforma para poder utilizar servicios de transcripción.
- **Autenticarse en la plataforma**: permite en cualquier momento autenticarse en la plataforma para poder utilizar los servicios de transcripción.
- **Cerrar sesión**: permite cerrar sesión de un usuario autenticado.
- **Transcribir fichero de audio**: permite transcribir ficheros de audio (permite subir ficheros de audio de hasta 20 MB).
- **Transcribir en tiempo real a partir del micrófono de ordenador**: permite ir transcribiendo en tiempo real lo que se va hablando por el micrófono del ordenador.
- **Listar el historial de transcripciones**: permite listar las transcripciones realizadas (se debe implementar una paginación de 10 elementos por página).
- **Descargar transcripciones**: permite descargar cualquier transcripción del historial.

> **Nota:** se recomienda para el servicio de transcripción utilizar la capa gratuita que ofrecen servicios de terceros como [Speechmatics](https://www.speechmatics.com/).

## Requisitos técnicos

### Backend

- NodeJS + Typescript
- Serverless framework ó Terraform
- Unidades computacionales: AWS Lambdas orquestadas por el framework de IaC
- Base de datos: DynamoDB
- Persistencia física: AWS S3
- Autenticación: AWS Cognito
- Pruebas unitarias: Jest

### Frontend

- NuxtJS + Typescript
- Framework para vistas: Materialize ó Tailwind CSS
- Pruebas unitarias: Jest
- Pruebas E2E: Cypress

> **Nota:** aunque no tiene que utilizar todas las herramientas que se le recomiendan, se valora adicionalmente el uso del stack sugerido.

## Aspectos adicionalmente valorados

### Arquitectura del proyecto

- Organización del código y modularidad.
- Uso adecuado del framework de IaC.

### Calidad del código

- Uso de TypeScript correctamente tipado.
- Buenas prácticas en Node.js y Nuxt.js.

### Integración con servicios de terceros

- Correcta implementación de la API de IA.
- Uso seguro de AWS Cognito.

### Despliegue

- Utilización de estrategias de CI/CD:
  - Análisis estático del código fuente.
  - Pruebas y cobertura de código.

## Tiempo

El ejercicio práctico debe enviarse en un plazo no mayor a 7 días.
