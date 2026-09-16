import {Injectable,signal} from '@angular/core';
@Injectable({providedIn:'root'})
export class DialogService {
 readonly state=signal<{title:string;message:string;confirm:boolean}|null>(null);
 private resolve:((v:boolean)=>void)|null=null;
 ask(title:string,message:string){return new Promise<boolean>(r=>{this.resolve=r;this.state.set({title,message,confirm:true});});}
 info(title:string,message:string){this.state.set({title,message,confirm:false});}
 error(error:unknown){const e=error as {error?:{mensaje?:string};status?:number};this.info('No se pudo completar',e.error?.mensaje??(e.status===0?'No hay conexión con el servidor. Vuelve a intentarlo.':'Ocurrió un error. Revisa los datos e inténtalo nuevamente.'));}
 close(value=false){this.state.set(null);this.resolve?.(value);this.resolve=null;}
}

