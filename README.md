# Archivo Frontend

Frontend Angular para búsqueda, digitalización y gestión de documentos.

## Requisitos

- Node.js compatible con Angular 22
- npm
- Backend disponible en `http://localhost:8080/api`

## Inicio

```bash
npm install
npm start
```

La aplicación se abre en `http://localhost:4200`.

## Comandos

```bash
npm start
npm run build
npm test -- --watch=false
```

## Organización

```text
src/app/
├── core/       # autenticación, guards, interceptores y servicios globales
├── shared/     # componentes y contratos reutilizables
└── features/   # módulos funcionales cargados bajo demanda
```

Los módulos funcionales iniciales son:

- `auth`: inicio de sesión.
- `busqueda`: consulta de metadatos y contenido OCR.
- `digitalizacion`: carga multipart y seguimiento del progreso.
- `expedientes`: registro y consulta de unidades documentales.
- `documentos-digitales`: listado, detalle, descarga y futura integración del visor.
- `prestamos`: circulación de expedientes físicos.
- `usuarios`: administración protegida por rol.
- `catalogos`: áreas, roles y etiquetas.
- `auditoria`: bitácora de operaciones.

## Integración con el backend

La URL se configura en `src/environments/environment.ts`. El frontend presupone autenticación JWT y añade automáticamente el encabezado `Authorization: Bearer <token>`.

Los contratos TypeScript iniciales son una base y deben alinearse con los DTO definitivos del backend antes de implementar todos los formularios.
