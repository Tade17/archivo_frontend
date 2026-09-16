import { HttpClient, HttpEvent } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentoDigital } from '../../shared/models/documento-digital.model';

export interface MetadatosCarga {
  expedienteId?: number;
  titulo: string;
  tipoDocumental?: string;
  tags?: string[];
}

@Injectable({ providedIn: 'root' })
export class DigitalizacionService {
  private readonly http = inject(HttpClient);

  cargar(archivo: File, metadatos: MetadatosCarga): Observable<HttpEvent<DocumentoDigital>> {
    const body = new FormData();
    body.append('archivo', archivo);
    body.append('metadatos', new Blob([JSON.stringify(metadatos)], { type: 'application/json' }));

    return this.http.post<DocumentoDigital>(`${environment.apiUrl}/documentos-digitales`, body, {
      observe: 'events',
      reportProgress: true,
    });
  }
}
