import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ArchiveApi } from '../../../core/services/archive-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { RecordFile, DigitalFile, Page } from '../../../core/models/archive.model';
import { PagerComponent } from '../../../shared/components/pager.component';
@Component({
  selector: 'app-expediente-detail',
  imports: [RouterLink, DatePipe, PagerComponent],
  template: ` <div class="page-heading">
      <div>
        <h1>Expediente <strong>en control</strong></h1>
        <p>Consulta sus metadatos y documentos digitales desde una sola ficha.</p>
      </div>
      <div class="flex gap-5 text-xs text-[var(--brand)]">
        <span>Registro ✓</span><span>Documentos {{ record()?.totalDocumentos ?? 0 }}</span>
      </div>
    </div>
    @if (record(); as r) {
      <div class="workspace grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <section class="panel">
          <div class="section-title">
            <div>
              <p class="eyebrow">{{ r.codigoUnico }}</p>
              <h2>{{ r.asunto }}</h2>
            </div>
            <span class="badge">Expediente digital</span>
          </div>
          <dl class="data-list grid sm:grid-cols-2 gap-x-7">
            <div>
              <dt>Número de documento</dt>
              <dd>{{ r.numeroDocumento }}</dd>
            </div>
            <div>
              <dt>Número de registro</dt>
              <dd>{{ r.numeroTramite }}</dd>
            </div>
            <div>
              <dt>Remitente</dt>
              <dd>{{ r.remitente }}</dd>
            </div>
            <div>
              <dt>Área de destino</dt>
              <dd>{{ r.areaDestinoNombre }}</dd>
            </div>
            <div>
              <dt>Tipo documental</dt>
              <dd>{{ r.tipoNombre }}</dd>
            </div>
            <div>
              <dt>Fecha del documento</dt>
              <dd>{{ r.fechaDocumento | date: 'dd/MM/yyyy' }}</dd>
            </div>
          </dl>
          <p class="eyebrow mt-7 mb-3">GLOSA</p>
          <p class="text-sm leading-7 whitespace-pre-wrap">
            {{ r.glosa || 'Sin glosa registrada.' }}
          </p>
          <div class="rule"></div>
          <h3>Documentos del expediente</h3>
          @for (d of docs()?.contenido; track d.id) {
            <a
              class="flex justify-between py-4 border-b border-[var(--line)]"
              [routerLink]="['/documentos', d.id]"
              ><span>{{ d.nombreArchivo }}</span
              ><span>Ver →</span></a
            >
          }
          @if (!docs()?.totalElementos) {
            <p class="text-xs text-[var(--muted)] mt-4">Todavía no se han cargado documentos.</p>
          }
          <app-pager
            [page]="docs()?.pagina ?? 0"
            [size]="20"
            [total]="docs()?.totalElementos ?? 0"
            (changed)="loadDocs($event)"
          />
        </section>
        <aside class="space-y-5">
          <section class="panel">
            <h3>Resumen digital</h3>
            <dl class="data-list mt-3">
              <div>
                <dt>Archivos vinculados</dt>
                <dd>{{ r.totalDocumentos }} documento(s)</dd>
              </div>
              <div>
                <dt>Registro</dt>
                <dd>{{ r.fechaRegistro | date: 'dd/MM/yyyy HH:mm' }}</dd>
              </div>
            </dl>
            <div class="flex flex-wrap gap-3 mt-6">
              @if (auth.can('GESTOR_DOCUMENTAL')) {
                <a class="btn secondary" [routerLink]="['/expedientes', r.id, 'editar']"
                  >Editar ficha</a
                >
              }
              @if (auth.can('GESTOR_DOCUMENTAL')) {
                <a
                  class="btn secondary"
                  routerLink="/digitalizar"
                  [queryParams]="{ expedienteId: r.id }"
                  >Añadir documentos</a
                >
              }
            </div>
          </section>
          <a class="text-button" routerLink="/buscar">← Volver a Explorar</a>
        </aside>
      </div>
    } @else {
      <div class="empty">Cargando expediente…</div>
    }`,
})
export class ExpedienteDetailComponent implements OnInit {
  api = inject(ArchiveApi);
  auth = inject(AuthService);
  dialog = inject(DialogService);
  route = inject(ActivatedRoute);
  record = signal<RecordFile | null>(null);
  docs = signal<Page<DigitalFile> | null>(null);
  id = this.route.snapshot.paramMap.get('id')!;
  ngOnInit() {
    this.api.record(this.id).subscribe({
      next: (r) => this.record.set(r),
      error: (e) => this.dialog.error(e),
    });
    this.loadDocs(0);
  }
  loadDocs(page: number) {
    this.api
      .documents(this.id, page)
      .subscribe({ next: (r) => this.docs.set(r), error: (e) => this.dialog.error(e) });
  }
}
