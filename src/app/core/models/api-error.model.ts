export interface ApiError {
  status: number;
  mensaje: string;
  detalles?: Record<string, string>;
  timestamp?: string;
}
