import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CatalogoItem {
  id: number;
  nombre: string;
  activo?: boolean;
}

export interface Catalogos {
  areas: CatalogoItem[];
  roles: CatalogoItem[];
  tags: CatalogoItem[];
}

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);

  listarTodos(): Observable<Catalogos> {
    return forkJoin({
      areas: this.http.get<CatalogoItem[]>(`${environment.apiUrl}/areas`),
      roles: this.http.get<CatalogoItem[]>(`${environment.apiUrl}/roles`),
      tags: this.http.get<CatalogoItem[]>(`${environment.apiUrl}/tags`),
    });
  }
}
