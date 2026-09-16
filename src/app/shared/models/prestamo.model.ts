export type EstadoPrestamo = 'ACTIVO' | 'DEVUELTO' | 'VENCIDO' | 'CANCELADO';

export interface Prestamo {
  id: number;
  expedienteId: number;
  expedienteCodigo?: string;
  usuarioId: number;
  usuarioNombre?: string;
  fechaPrestamo: string;
  fechaDevolucionPrevista: string;
  fechaDevolucionReal?: string;
  estado: EstadoPrestamo;
  observaciones?: string;
}
