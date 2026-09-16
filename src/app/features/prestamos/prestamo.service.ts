import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaRespuesta } from '../../shared/models/pagina-response.model';
import { Prestamo } from '../../shared/models/prestamo.model';

export interface CrearPrestamoRequest {
  expedienteId: number;
  usuarioId: number;
  fechaDevolucionPrevista: string;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class PrestamoService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/prestamos`;

  listar(pagina = 0, tamano = 20): Observable<PaginaRespuesta<Prestamo>> {
    const params = new HttpParams().set('pagina', pagina).set('tamano', tamano);
    return this.http.get<PaginaRespuesta<Prestamo>>(this.endpoint, { params });
  }

  devolver(id: number): Observable<Prestamo> {
    return this.http.patch<Prestamo>(`${this.endpoint}/${id}/devolucion`, {});
  }

  crear(request: CrearPrestamoRequest): Observable<Prestamo> {
    return this.http.post<Prestamo>(this.endpoint, request);
  }
}
