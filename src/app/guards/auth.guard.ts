import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }

  const usuario = authService.obtenerUsuario();
  const rol = usuario?.rol.toLowerCase();

  // Rutas permitidas según rol
  const ruta = route.routeConfig?.path;

  if (rol === 'admin') return true; // admin acceso total
  if (rol === 'cajero' && ['ventas', 'historial'].includes(ruta!)) return true;
  if (rol === 'mesero' && ruta === 'pedidos') return true;
  if (rol === 'cocina' && ruta === 'cocina') return true;

  // si no tiene permiso
  return router.createUrlTree(['/login']);
};
