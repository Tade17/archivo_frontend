import {Component,inject,viewChild,ElementRef,effect} from '@angular/core';import {DialogService} from '../../core/services/dialog.service';
@Component({selector:'app-confirm-dialog',template:`
<dialog #modal (cancel)="cancel($event)" aria-labelledby="modal-title" class="confirm-dialog">
@if(dialog.state();as s){<span class="eyebrow">ARCHIVO MUNICIPAL</span><h2 id="modal-title">{{s.title}}</h2><p>{{s.message}}</p><div class="flex justify-end gap-3 mt-7">@if(s.confirm){<button class="btn secondary" (click)="dialog.close(false)">Cancelar</button>}<button autofocus class="btn" (click)="dialog.close(true)">{{s.confirm?'Confirmar':'Entendido'}}</button></div>}
</dialog>`})
export class ConfirmDialogComponent {readonly dialog=inject(DialogService);modal=viewChild<ElementRef<HTMLDialogElement>>('modal');constructor(){effect(()=>{const state=this.dialog.state(),el=this.modal()?.nativeElement;if(el){if(state&&!el.open)el.showModal();if(!state&&el.open)el.close();}});}cancel(e:Event){e.preventDefault();this.dialog.close(false);}}

