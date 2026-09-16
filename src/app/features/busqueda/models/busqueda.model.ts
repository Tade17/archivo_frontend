import { DocumentoDigital } from '../../../shared/models/documento-digital.model';

export interface FiltrosBusqueda {
  texto: string;
  expediente?: string;
  areaId?: number;
  tipoDocumental?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  tags?: string[];
  pagina?: number;
  tamano?: number;
}

export interface ResultadoBusqueda {
  documento: DocumentoDigital;
  expedienteCodigo?: string;
  fragmento?: string;
  relevancia?: number;
}
