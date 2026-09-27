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
}
export interface DigitalFile {
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
