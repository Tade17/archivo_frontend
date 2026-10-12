export interface Page<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
}
export interface CatalogItem {
  id: string;
  nombre: string;
  padre?: string;
}
export interface Catalogs {
  areas: CatalogItem[];
  tipos: CatalogItem[];
  roles: CatalogItem[];
}
export interface RecordFile {
  id: string;
  codigoUnico: string;
  numeroDocumento: string;
  numeroTramite: string;
  anioIngreso: number;
  remitente: string;
  asunto: string;
  glosa: string;
  areaDestinoId: string;
  areaDestinoNombre: string;
  tipoId: string;
  tipoNombre: string;
  estadoId: string;
  estadoNombre: string;
  fechaDocumento: string;
  fechaRegistro: string;
  documentoId: string | null;
  documentoNombre: string | null;
  totalDocumentos: number;
  destinatario: string | null;
  numeroFolios: number | null;
  contenedorId: string;
  contenedorTipo: TipoContenedor;
  contenedorDescripcion: string;
  contenedorEstado: EstadoContenedor;
  prestado?: boolean;
  seccion: string;
  nivel: string;
  area: string;
}
export type TipoContenedor = 'ARCHIVADOR' | 'FOLDER';
export type EstadoContenedor = 'PENDIENTE' | 'COMPLETADO';
/** Archivador o folder físico guardado en un Área (Sección → Nivel → Área). */
export interface Prestamo {
  id: string;
  objeto: 'DOCUMENTO' | 'CONTENEDOR';
  expedienteId: string | null;
  expedienteCodigo: string | null;
  expedienteAsunto: string | null;
  contenedorId: string | null;
  contenedorDescripcion: string | null;
  solicitante: string;
  observaciones: string | null;
  fechaSolicitud: string;
  fechaDevolucionPrevista: string;
  fechaDevolucionReal: string | null;
  estado: 'PRESTADO' | 'DEVUELTO';
  registradoPor: string;
  diasRestantes: number | null;
  semaforo: 'VERDE' | 'AMARILLO' | 'ROJO' | 'GRIS';
}
export interface ResumenPrestamos {
  sinDevolver: number;
  porVencer: number;
  vencidos: number;
}
export interface Contenedor {
  prestado?: boolean;
  id: string;
  tipo: TipoContenedor;
  descripcion: string;
  estado: EstadoContenedor;
  fechaRegistro: string;
  fechaActualizacion: string;
  creadoPorNombre: string;
  areaId: string;
  area: string;
  nivelId: string;
  nivel: string;
  seccionId: string;
  seccion: string;
  totalDocumentos: number;
}
export interface UbicacionItem {
  id: string;
  codigo: string;
}
/** Matriz física del archivo: Sección (estante) → Nivel → Área (caja). */
export interface Ubicaciones {
  archivoCentral: { id?: string; nombre?: string };
  secciones: UbicacionItem[];
  niveles: (UbicacionItem & { seccionId: string })[];
  areas: (UbicacionItem & { nivelId: string; totalContenedores: number })[];
}
export interface DigitalFile {
  pdfDisponible: boolean;
  id: string;
  expedienteId: string;
  expedienteCodigoUnico: string;
  nombreArchivo: string;
  tipoMime: string;
  hashSha256: string;
  fechaDigitalizacion: string;
  tecnicoResponsableNombre: string;
  escanerUtilizado: string;
  resolucionDpi: number;
  formatoSalida: string;
  ocrTexto: string | null;
  ocrEstado: 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'REQUIERE_REVISION' | 'ERROR';
  ocrConfianza: number | null;
  ocrPaginas: number | null;
  ocrError: string | null;
  ocrIntentos: number;
  ocrRevisado: boolean;
  ocrActualizadoEn: string | null;
}
export interface User {
  id: string;
  nombre: string;
  correo: string;
  rolNombre: string;
  activo: boolean;
}
export interface Loan {
  id: string;
  expedienteId: string;
  expedienteCodigoUnico: string;
  asunto: string;
  solicitanteNombre: string;
  correo: string;
  tipoSolicitud: string;
  fechaSolicitud: string;
  fechaDevolucionPrevista: string;
  fechaDevolucionReal: string | null;
  estado: string;
  motivo: string;
  observaciones: string;
  condicionDevolucion: string;
}
export interface AuditEvent {
  id: string;
  usuario: string;
  modulo: string;
  recurso: string;
  accion: string;
  fecha: string;
}
