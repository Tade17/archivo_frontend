# Archivo municipal: interfaz web

Interfaz Angular para consultar expedientes, subir PDF e imágenes y seguir el reconocimiento automático de texto. El OCR se ejecuta en el backend, no en el navegador.

## Requisitos

1. Git y **Node.js 24.15 o superior dentro de 24.x**.
2. **npm 11.16.0**, versión declarada por el proyecto.
3. [Backend iniciado](https://github.com/Tade17/archivo_backend#readme), incluidos PostgreSQL y OCR; API en `http://localhost:8080`.

El lockfile admite Node `^22.22.3 || ^24.15.0 || >=26.0.0`; una versión antigua de Node22 no es suficiente. La recomendación mantiene al equipo en una línea compatible.

```powershell
git --version
node --version
npm --version
```

Si npm no coincide, instala la versión indicada mediante el gestor de herramientas del equipo. No necesitas Angular CLI global: está incluido localmente.

## Inicio rápido

En otra terminal, desde la carpeta donde guardarás el repositorio:

```powershell
git clone https://github.com/Tade17/archivo_frontend.git
Set-Location archivo_frontend
npm ci
npm start
```

Abre **[http://localhost:4200](http://localhost:4200)**. Mantén esta terminal abierta; `Ctrl+C` detiene la interfaz. La primera instalación necesita Internet.

`npm ci` respeta `package-lock.json`. No reemplaces el lockfile ni uses `npm update` como paso de instalación.

### Primer acceso

Usa una cuenta existente en la base del backend. Si la instalación es nueva, sigue **Primer acceso** en su README. Instalar el frontend no crea usuarios ni cambia contraseñas. Coordina las credenciales con el responsable y no las publiques.

## Cómo se procesan los archivos

- Crea o abre un expediente y usa **Añadir documentos**.
- Ordena las imágenes: forman un PDF en ese orden. Los PDF adjuntos permanecen separados y los originales se conservan.
- **Guardar documentos** confirma la carga, no la finalización del OCR. Consulta después su fase y páginas procesadas.
- El PDF reconocido permite seleccionar, copiar y buscar texto sin editarlo. Un fallo se reintenta desde el documento existente.

La conversión de imágenes necesita OCR disponible incluso antes de guardar. Consulta [límites y estados](https://github.com/Tade17/archivo_backend/blob/main/OCR.md).

## Dirección de la API

| Entorno | Archivo | Dirección |
|---|---|---|
| `npm start` | [environment.ts](src/environments/environment.ts) | `http://localhost:8080/api` |
| Producción | [environment.prod.ts](src/environments/environment.prod.ts) | `/api` |

Si usas otra API, modifica `apiUrl` del entorno correspondiente y reinicia el servidor de desarrollo. No pongas secretos en estos archivos: el navegador puede leerlos.

La compilación de producción necesita un servidor web que publique los archivos, dirija **`/api` al backend** y devuelva la aplicación para las rutas del cliente. `npm run build` no configura ni despliega esos servicios. El servidor de desarrollo no es un despliegue de producción.

La autenticación usa JWT; el interceptor añade `Authorization: Bearer <token>` a las solicitudes de la API.

## Actualizar una copia existente

Guarda o confirma tus cambios locales; no los descartes para forzar una actualización. Detén `npm start` con `Ctrl+C` y ejecuta dentro del repositorio:

```powershell
git status
git switch main
git pull --ff-only origin main
npm ci
npm start
```

Si Git informa divergencias, detente y coordina la integración, sin reset destructivo. Actualiza también backend e imagen OCR según su guía; recibir solo la interfaz no actualiza esos servicios. Recarga con `Ctrl+F5`.

## Verificar cambios

```powershell
npm test -- --watch=false
npm run build
```

La compilación no verifica por sí sola login ni un OCR completo: eso necesita backend y una carga sintética.

## Problemas frecuentes

| Síntoma | Revisión |
|---|---|
| `npm ci` rechaza el motor Node | Compara las versiones Node/npm con los requisitos |
| No abre 4200 | Revisa la terminal y que no haya otro proceso usando el puerto |
| Aviso genérico al ingresar | Revisa la solicitud fallida en Red del navegador y los registros Java |
| Error de red, conexión rechazada o estado 0 | API en 8080 y `apiUrl`; una API apagada no se arregla cambiando la contraseña |
| HTTP 401 en login | Cuenta vigente y base de datos correcta |
| HTTP 500 en otro endpoint tras login | Puede fallar una vista previa o consulta posterior |
| OCR no avanza | Comprueba `jobsReady: true` y `/v2/jobs/config` según la guía backend |
| Sigue la interfaz anterior | Reinicia `npm start` y recarga con `Ctrl+F5` |

No compartas contraseñas, tokens ni documentos reales al reportar fallos. Usa ejemplos sintéticos y registros redactados.

## Organización

```text
src/app/
  core/       autenticación, guards, interceptores y servicios globales
  shared/     componentes y contratos compartidos
  features/   pantallas cargadas bajo demanda
```

Las [rutas actuales](src/app/app.routes.ts) incluyen consulta, expedientes, carga y visor de documentos, además de funciones administrativas según el perfil.
