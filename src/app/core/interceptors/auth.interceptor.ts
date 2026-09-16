import {HttpInterceptorFn} from '@angular/common/http';import {inject} from '@angular/core';import {AuthService} from '../services/auth.service';import {environment} from '../../../environments/environment';
export const authInterceptor:HttpInterceptorFn=(req,next)=>{const token=inject(AuthService).token();const scoped=req.url===environment.apiUrl||req.url.startsWith(environment.apiUrl+'/');return next(token&&scoped&&!req.url.endsWith('/auth/login')?req.clone({setHeaders:{Authorization:'Bearer '+token}}):req);};

