import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Expediente } from '../../shared/models/expediente.model';
import { PaginaRespuesta } from '../../shared/models/pagina-response.model';

export type CrearExpedienteRequest = Omit<Expediente, 'id' | 'cantidadDocumentos' | 'areaNombre'>;

@Injectable({ providedIn: 'root' })
export class ExpedienteService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/expedientes`;

  listar(pagina = 0, tamano = 20): Observable<PaginaRespuesta<Expediente>> {
    const params = new HttpParams().set('pagina', pagina).set('tamano', tamano);
    return this.http.get<PaginaRespuesta<Expediente>>(this.endpoint, { params });
  }

  obtener(id: number): Observable<Expediente> {
    return this.http.get<Expediente>(`${this.endpoint}/${id}`);
  }

  crear(request: CrearExpedienteRequest): Observable<Expediente> {
    return this.http.post<Expediente>(this.endpoint, request);
  }
}
