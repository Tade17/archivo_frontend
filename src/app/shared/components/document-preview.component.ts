import {Component,input,signal,effect,viewChild,ElementRef,inject,OnDestroy} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ArchiveApi} from '../../core/services/archive-api.service';
import {DialogService} from '../../core/services/dialog.service';
import type {PDFDocumentProxy,RenderTask} from 'pdfjs-dist';
@Component({selector:'app-document-preview',imports:[FormsModule],template:`
<div class="h-full flex flex-col min-h-[460px]">
<div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3 bg-white">
<span class="text-xs text-[var(--muted)]">{{loading()?'Abriendo documento…':page()+' / '+pages()}}</span>
<div class="flex gap-2"><button class="icon-button" aria-label="Reducir" (click)="zoom(-.15)" [disabled]="!pdf">−</button><button class="icon-button" aria-label="Ampliar" (click)="zoom(.15)" [disabled]="!pdf">+</button><button class="icon-button" aria-label="Girar página" (click)="rotate()" [disabled]="!pdf">↻</button></div>
</div>
@if(full()){<div class="flex gap-2 bg-white p-3 border-b border-[var(--line)]"><input aria-label="Buscar dentro del documento" placeholder="Buscar dentro del documento…" [(ngModel)]="query" (keyup.enter)="find()"><button class="btn small secondary" (click)="find()" [disabled]="!pdf||searching()">Buscar</button></div>
@if(searchDone()){<div class="p-3 text-xs bg-white" aria-live="polite">{{hits().length}} página(s) con coincidencias @for(hit of hits();track hit){<button class="text-button mx-2" (click)="go(hit)">Pág. {{hit}}</button>}</div>}}
<div class="bg-[var(--soft)] overflow-auto flex-1 p-5 relative text-center">
@if(!id()){<div class="empty">Selecciona un expediente con documento digital.</div>}
@if(message()){<p class="empty">{{message()}}</p>}
<canvas #canvas [class.hidden]="!pdf" class="mx-auto shadow-md max-w-full" aria-label="Página del documento"></canvas>
@if(imageUrl()){<img [src]="imageUrl()" alt="Documento digitalizado" class="mx-auto max-w-full shadow-md">}
</div>
@if(pdf){<div class="flex items-center justify-center gap-4 p-3 bg-white"><button class="icon-button" aria-label="Página anterior del documento" [disabled]="page()<=1" (click)="go(page()-1)">‹</button><span class="text-xs">Página {{page()}} de {{pages()}}</span><button class="icon-button" aria-label="Página siguiente del documento" [disabled]="page()>=pages()" (click)="go(page()+1)">›</button></div>}
</div>`})
export class DocumentPreviewComponent implements OnDestroy {
 id=input<string|null>(null);full=input(false);canvas=viewChild<ElementRef<HTMLCanvasElement>>('canvas');
 api=inject(ArchiveApi);dialog=inject(DialogService);page=signal(1);pages=signal(0);loading=signal(false);message=signal('');imageUrl=signal('');hits=signal<number[]>([]);searchDone=signal(false);searching=signal(false);query='';pdf:PDFDocumentProxy|null=null;private scale=1.2;private rotation=0;private serial=0;private rendering:RenderTask|null=null;
 constructor(){effect(()=>{const id=this.id(),canvas=this.canvas();if(canvas)void this.open(id);});}
 private async open(id:string|null){const serial=++this.serial;this.rendering?.cancel();void this.pdf?.cleanup();this.pdf=null;if(this.imageUrl())URL.revokeObjectURL(this.imageUrl());this.imageUrl.set('');this.message.set('');this.page.set(1);this.pages.set(0);this.hits.set([]);this.searchDone.set(false);if(!id)return;this.loading.set(true);
 this.api.binary(id).subscribe({next:async blob=>{if(serial!==this.serial)return;try{if(blob.type.startsWith('image/')&&blob.type!=='image/tiff'){this.imageUrl.set(URL.createObjectURL(blob));return;}if(blob.type!=='application/pdf'){this.message.set('Este formato no tiene vista previa. Descarga el original para abrirlo.');return;}const engine=await import('pdfjs-dist');engine.GlobalWorkerOptions.workerSrc='/pdfjs/pdf.worker.min.mjs';const pdf=await engine.getDocument({data:await blob.arrayBuffer()}).promise;if(serial!==this.serial){void pdf.cleanup();return;}this.pdf=pdf;this.pages.set(pdf.numPages);await this.render();}catch{this.message.set('No se pudo interpretar el documento. Puedes descargar el original.');}finally{if(serial===this.serial)this.loading.set(false);}},error:e=>{if(serial===this.serial){this.loading.set(false);this.message.set('No se pudo abrir la vista previa.');this.dialog.error(e);}}});}
 async render(){const pdf=this.pdf,canvas=this.canvas()?.nativeElement;if(!pdf||!canvas)return;this.rendering?.cancel();try{const p=await pdf.getPage(this.page());const vp=p.getViewport({scale:this.scale,rotation:this.rotation});canvas.width=vp.width;canvas.height=vp.height;const task=p.render({canvas,viewport:vp});this.rendering=task;await task.promise;if(this.query.trim()){const engine=await import('pdfjs-dist');const text=await p.getTextContent();const ctx=canvas.getContext('2d')!;for(const item of text.items){if('str' in item&&item.str.toLowerCase().includes(this.query.toLowerCase())){const t=engine.Util.transform(vp.transform,item.transform);ctx.fillStyle='#F3CC5888';ctx.fillRect(t[4],t[5]-Math.abs(t[3]),item.width*this.scale,Math.abs(t[3])*1.3);}}}}catch(e){if((e as Error).name!=='RenderingCancelledException')this.message.set('No se pudo mostrar esta página.');}}
 go(n:number){this.page.set(n);void this.render();}zoom(delta:number){this.scale=Math.max(.5,Math.min(3,this.scale+delta));void this.render();}rotate(){this.rotation=(this.rotation+90)%360;void this.render();}
 async find(){if(!this.pdf)return;const query=this.query.trim().toLowerCase();this.hits.set([]);this.searchDone.set(true);if(!query){void this.render();return;}this.searching.set(true);const pdf=this.pdf;try{const result:number[]=[];for(let i=1;i<=pdf.numPages;i++){const text=await(await pdf.getPage(i)).getTextContent();if(text.items.map(x=>'str'in x?x.str:'').join(' ').toLowerCase().includes(query))result.push(i);}this.hits.set(result);if(result.length)this.go(result[0]);}finally{this.searching.set(false);}}
 ngOnDestroy(){this.serial++;this.rendering?.cancel();void this.pdf?.cleanup();if(this.imageUrl())URL.revokeObjectURL(this.imageUrl());}
}
