import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaRespuesta } from '../../shared/models/pagina-response.model';
import { FiltrosBusqueda, ResultadoBusqueda } from './models/busqueda.model';

@Injectable({ providedIn: 'root' })
export class BusquedaService {
  private readonly http = inject(HttpClient);

  buscar(filtros: FiltrosBusqueda): Observable<PaginaRespuesta<ResultadoBusqueda>> {
    let params = new HttpParams()
      .set('texto', filtros.texto)
      .set('pagina', filtros.pagina ?? 0)
      .set('tamano', filtros.tamano ?? 20);

    if (filtros.expediente) params = params.set('expediente', filtros.expediente);
    if (filtros.areaId) params = params.set('areaId', filtros.areaId);
    if (filtros.tipoDocumental) params = params.set('tipoDocumental', filtros.tipoDocumental);
    if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
    for (const tag of filtros.tags ?? []) params = params.append('tags', tag);

    return this.http.get<PaginaRespuesta<ResultadoBusqueda>>(`${environment.apiUrl}/busqueda`, {
      params,
    });
  }
}
