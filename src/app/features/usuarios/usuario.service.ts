import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaRespuesta } from '../../shared/models/pagina-response.model';
import { Usuario } from '../../shared/models/usuario.model';

export interface CrearUsuarioRequest {
  username: string;
  nombre: string;
  email?: string;
  password: string;
  areaId?: number;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/usuarios`;

  listar(pagina = 0, tamano = 20): Observable<PaginaRespuesta<Usuario>> {
    const params = new HttpParams().set('pagina', pagina).set('tamano', tamano);
    return this.http.get<PaginaRespuesta<Usuario>>(this.endpoint, { params });
  }

  cambiarEstado(id: number, activo: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.endpoint}/${id}/estado`, { activo });
  }

  crear(request: CrearUsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.endpoint, request);
  }
}
