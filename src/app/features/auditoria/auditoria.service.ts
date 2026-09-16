import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaRespuesta } from '../../shared/models/pagina-response.model';

export interface EventoAuditoria {
  id: number;
  fecha: string;
  usuario: string;
  accion: string;
  recurso: string;
  recursoId?: string;
  detalle?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  listar(pagina = 0, tamano = 20): Observable<PaginaRespuesta<EventoAuditoria>> {
    const params = new HttpParams().set('pagina', pagina).set('tamano', tamano);
    return this.http.get<PaginaRespuesta<EventoAuditoria>>(`${environment.apiUrl}/auditoria`, {
      params,
    });
  }
}
