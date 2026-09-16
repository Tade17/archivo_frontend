export type EstadoExpediente = 'ABIERTO' | 'CERRADO' | 'PRESTADO' | 'ARCHIVADO';

export interface Expediente {
  id: number;
  codigo: string;
  asunto: string;
  descripcion?: string;
  areaId: number;
  areaNombre?: string;
  fechaApertura: string;
  estado: EstadoExpediente;
  cantidadDocumentos?: number;
  tags?: string[];
}
