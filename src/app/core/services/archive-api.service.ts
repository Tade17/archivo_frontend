import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Page,
  RecordFile,
  DigitalFile,
  Catalogs,
  User,
  AuditEvent,
  Contenedor,
  TipoContenedor,
  Ubicaciones,
  Prestamo,
  ResumenPrestamos,
  ReporteDefinicion,
  ReporteResultado,
} from '../models/archive.model';
@Injectable({ providedIn: 'root' })
export class ArchiveApi {
  private http = inject(HttpClient);
  readonly base = environment.apiUrl;
  params(values: Record<string, unknown>) {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(values))
      if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
    return p;
  }
  search(filters: Record<string, unknown> = {}, page = 0, size = 4) {
    return this.http.get<Page<RecordFile>>(this.base + '/workspace/buscar', {
      params: this.params({ ...filters, page, size }),
    });
  }
  record(id: string) {
    return this.http.get<RecordFile>(this.base + '/workspace/expedientes/' + id);
  }
  catalogs() {
    return this.http.get<Catalogs>(this.base + '/workspace/catalogos');
  }
  receive(body: unknown) {
    return this.http.post<{ id: string; codigoUnico: string }>(
      this.base + '/workspace/recepcion',
      body,
    );
  }
  edit(id: string, body: unknown) {
    return this.http.put(this.base + '/workspace/expedientes/' + id, body);
  }
  documents(expedienteId: string, page = 0) {
    return this.http.get<Page<DigitalFile>>(this.base + '/documentos-digitales', {
      params: { expedienteId, page, size: 20 },
    });
  }
  document(id: string) {
    return this.http.get<DigitalFile>(this.base + '/documentos-digitales/' + id);
  }
  binary(id: string, download = false) {
    return this.http.get(
      this.base +
        (download ? '/documentos-digitales/' : '/workspace/documentos/') +
        id +
        (download ? '/archivo' : '/vista'),
      { responseType: 'blob' },
    );
  }
  upload(body: FormData) {
    return this.http.post<DigitalFile[]>(this.base + '/documentos-digitales', body, {
      observe: 'events',
      reportProgress: true,
    });
  }
  retryOcr(id: string) {
    return this.http.post<void>(this.base + '/documentos-digitales/' + id + '/ocr/reintentar', {});
  }
  pdf(id: string) {
    return this.http.get(this.base + '/documentos-digitales/' + id + '/pdf', {
      responseType: 'blob',
    });
  }
  /** Todas las cuentas (para elegir una persona en un filtro). */
  usersAll() {
    return this.http.get<Page<User>>(this.base + '/usuarios', { params: { page: 0, size: 200 } });
  }
  users(page = 0) {
    return this.http.get<Page<User>>(this.base + '/usuarios', { params: { page, size: 10 } });
  }
  saveUser(id: string | null, body: unknown) {
    return id
      ? this.http.put<User>(this.base + '/usuarios/' + id, body)
      : this.http.post<User>(this.base + '/usuarios', body);
  }
  suspendUser(id: string) {
    return this.http.delete(this.base + '/usuarios/' + id);
  }
  audit(filters: Record<string, unknown> = {}, page = 0, size = 10) {
    return this.http.get<Page<AuditEvent>>(this.base + '/workspace/auditoria', {
      params: this.params({ ...filters, page, size }),
    });
  }
  auditSummary() {
    return this.http.get<Record<string, number>>(this.base + '/workspace/auditoria/resumen');
  }
  createCatalog(path: string, body: unknown) {
    return this.http.post(this.base + '/' + path, body);
  }
  updateCatalog(path: string, id: string, body: unknown) {
    return this.http.put(this.base + '/' + path + '/' + id, body);
  }
  deleteCatalog(path: string, id: string) {
    return this.http.delete(this.base + '/' + path + '/' + id);
  }
  deleteRecord(id: string) {
    return this.http.delete(this.base + '/expedientes/' + id);
  }
  deleteDocument(id: string) {
    return this.http.delete(this.base + '/documentos-digitales/' + id);
  }
  prestamos(filters: Record<string, unknown> = {}, page = 0, size = 20) {
    return this.http.get<Page<Prestamo>>(this.base + '/workspace/prestamos', {
      params: this.params({ ...filters, page, size }),
    });
  }
  reportes() {
    return this.http.get<ReporteDefinicion[]>(this.base + '/workspace/reportes');
  }
  reporte(codigo: string, filters: Record<string, unknown> = {}) {
    return this.http.get<ReporteResultado>(this.base + '/workspace/reportes/' + codigo, {
      params: this.params(filters),
    });
  }
  prestamosResumen() {
    return this.http.get<ResumenPrestamos>(this.base + '/workspace/prestamos/resumen');
  }
  crearPrestamo(body: unknown) {
    return this.http.post<Prestamo>(this.base + '/workspace/prestamos', body);
  }
  devolverPrestamo(id: string) {
    return this.http.post<Prestamo>(this.base + '/workspace/prestamos/' + id + '/devolver', {});
  }
  ubicaciones() {
    return this.http.get<Ubicaciones>(this.base + '/workspace/ubicaciones');
  }
  saveUbicacion(tipo: UbicacionTipo, id: string | null, body: unknown) {
    const url = this.base + '/' + UBICACION_PATH[tipo];
    return id ? this.http.put(url + '/' + id, body) : this.http.post(url, body);
  }
  deleteUbicacion(tipo: UbicacionTipo, id: string) {
    return this.http.delete(this.base + '/' + UBICACION_PATH[tipo] + '/' + id);
  }
  contenedores(filters: Record<string, unknown> = {}, page = 0, size = 20) {
    return this.http.get<Page<Contenedor>>(this.base + '/workspace/contenedores', {
      params: this.params({ ...filters, page, size }),
    });
  }
  contenedor(id: string) {
    return this.http.get<Contenedor>(this.base + '/workspace/contenedores/' + id);
  }
  saveContenedor(
    id: string | null,
    body: { cajaId: string; tipo: TipoContenedor; descripcion: string },
  ) {
    const url = this.base + '/workspace/contenedores';
    return id
      ? this.http.put<{ id: string }>(url + '/' + id, body)
      : this.http.post<{ id: string }>(url, body);
  }
  cambiarEstadoContenedor(id: string, accion: 'completar' | 'reabrir') {
    return this.http.post(this.base + '/workspace/contenedores/' + id + '/' + accion, {});
  }
  deleteContenedor(id: string) {
    return this.http.delete(this.base + '/workspace/contenedores/' + id);
  }
}
export type UbicacionTipo = 'seccion' | 'nivel' | 'area';
const UBICACION_PATH: Record<UbicacionTipo, string> = {
  seccion: 'estantes',
  nivel: 'niveles',
  area: 'cajas',
};
