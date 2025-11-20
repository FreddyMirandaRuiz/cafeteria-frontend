import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthClienteService } from '../services/auth-cliente.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthClienteInterceptor implements HttpInterceptor {

  constructor(private authCliente: AuthClienteService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authCliente.obtenerToken();

    const reqClonada = token ? req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    }) : req;

    return next.handle(reqClonada).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          alert('⚠️ Tu sesión ha expirado. Inicia sesión nuevamente.');
          this.authCliente.cerrarSesion();
          this.router.navigate(['/login-cliente']);
        }
        return throwError(() => error);
      })
    );
  }
}