export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  email?: string;
  activo: boolean;
  roles: string[];
  areaId?: number;
}
