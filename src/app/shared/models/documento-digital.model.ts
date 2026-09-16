export type EstadoProcesamiento =
  'PENDIENTE' | 'CARGANDO' | 'PROCESANDO_OCR' | 'INDEXANDO' | 'COMPLETADO' | 'ERROR';

export interface DocumentoDigital {
  id: number;
  expedienteId?: number;
  nombre: string;
  titulo?: string;
  tipoDocumental?: string;
  mimeType: string;
  tamanoBytes: number;
  numeroPaginas?: number;
  fechaCarga: string;
  estadoProcesamiento: EstadoProcesamiento;
  tags?: string[];
}
