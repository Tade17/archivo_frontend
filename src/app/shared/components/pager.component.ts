import {Component,input,output} from '@angular/core';
@Component({selector:'app-pager',template:`<div class="pager"><span>{{total()?page()*size()+1:0}}—{{end()}} de {{total()}}</span><div class="flex items-center gap-3"><button class="icon-button" aria-label="Página anterior" [disabled]="page()===0||busy()" (click)="changed.emit(page()-1)">←</button><span>{{page()+1}}</span><button class="icon-button" aria-label="Página siguiente" [disabled]="end()>=total()||busy()" (click)="changed.emit(page()+1)">→</button></div></div>`})
export class PagerComponent {page=input(0);size=input(4);total=input(0);busy=input(false);changed=output<number>();end(){return Math.min((this.page()+1)*this.size(),this.total());}}

