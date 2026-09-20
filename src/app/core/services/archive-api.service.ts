import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Page, RecordFile, DigitalFile, Catalogs, User, AuditEvent } from '../models/archive.model';
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
  saveText(d: DigitalFile, text: string, userId: string) {
    return this.http.put(this.base + '/documentos-digitales/' + d.id, {
      nombreArchivo: d.nombreArchivo,
      tecnicoResponsableId: userId,
      escanerUtilizado: d.escanerUtilizado,
      resolucionDpi: d.resolucionDpi,
      formatoSalida: d.formatoSalida,
      ocrTexto: text,
    });
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
}
