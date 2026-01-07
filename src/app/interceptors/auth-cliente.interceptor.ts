import { Injectable, inject } from '@angular/core';
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
  private authCliente = inject(AuthClienteService);
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 1. Verificar si la URL es para el personal interno (Ignorar este interceptor)
    if (req.url.includes('/api/auth/')) {
      return next.handle(req);
    }

    // 2. Lógica para la Tienda Online
    const token = this.authCliente.obtenerToken();
    const reqClonada = token ? req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    }) : req;

    return next.handle(reqClonada).pipe(
      catchError((error: HttpErrorResponse) => {
        // Solo redirigir al login-cliente si el error viene de una ruta de cliente
        if (error.status === 401 && req.url.includes('/api/auth-cliente')) {
          alert('⚠️ Tu sesión de cliente ha expirado.');
          this.authCliente.cerrarSesion();
          this.router.navigate(['/login-cliente']);
        }
        return throwError(() => error);
      })
    );
  }
}