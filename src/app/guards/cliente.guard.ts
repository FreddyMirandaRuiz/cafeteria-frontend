import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthClienteService } from '../services/auth-cliente.service';

export const clienteGuard: CanActivateFn = () => {
  const auth = inject(AuthClienteService);
  const router = inject(Router);

  if (!auth.estaLogueado()) {
    alert('Debes iniciar sesión para continuar 🧍‍♂️');
    router.navigate(['/login-cliente']);
    return false;
  }
  return true;
};