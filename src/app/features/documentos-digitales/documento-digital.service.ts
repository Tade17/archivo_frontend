import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentoDigital } from '../../shared/models/documento-digital.model';
import { PaginaRespuesta } from '../../shared/models/pagina-response.model';

@Injectable({ providedIn: 'root' })
export class DocumentoDigitalService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/documentos-digitales`;

  listar(pagina = 0, tamano = 20): Observable<PaginaRespuesta<DocumentoDigital>> {
    const params = new HttpParams().set('pagina', pagina).set('tamano', tamano);
    return this.http.get<PaginaRespuesta<DocumentoDigital>>(this.endpoint, { params });
  }

  obtener(id: number): Observable<DocumentoDigital> {
    return this.http.get<DocumentoDigital>(`${this.endpoint}/${id}`);
  }

  descargar(id: number): Observable<Blob> {
    return this.http.get(`${this.endpoint}/${id}/archivo`, { responseType: 'blob' });
  }
}
