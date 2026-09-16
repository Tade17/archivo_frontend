import {HttpClient} from '@angular/common/http';
import {computed,inject,Injectable,signal} from '@angular/core';
import {tap} from 'rxjs';
import {environment} from '../../../environments/environment';
interface Session {token:string;usuarioId:string;nombre:string;correo:string;rol:string;username:string;}
@Injectable({providedIn:'root'})
export class AuthService {
 private http=inject(HttpClient);
 private state=signal<Session|null>(this.restore());
 readonly token=computed(()=>this.state()?.token??null);
 readonly usuario=computed(()=>this.state());
 readonly isAuthenticated=computed(()=>!!this.state());
 login(body:{correo?:string;username?:string;password:string}){
 return this.http.post<Session>(environment.apiUrl+'/auth/login',{correo:body.correo??body.username,password:body.password}).pipe(tap(s=>{const value={...s,username:s.correo};this.state.set(value);sessionStorage.setItem('archivo_session',JSON.stringify(value));}));
 }
 hasRole(role:string){return this.state()?.rol?.toUpperCase()===role;}
 can(...roles:string[]){return this.hasRole('ADMIN')||roles.some(r=>this.hasRole(r));}
 logout(){this.state.set(null);sessionStorage.removeItem('archivo_session');localStorage.removeItem('archivo_access_token');localStorage.removeItem('archivo_session_user');}
 private restore():Session|null {try{const s=JSON.parse(sessionStorage.getItem('archivo_session')??'null');if(!s?.token)return null;const raw=s.token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const p=JSON.parse(atob(raw));return p.exp*1000>Date.now()?s:null;}catch{return null;}}
}

