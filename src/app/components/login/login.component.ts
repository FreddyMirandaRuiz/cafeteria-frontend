import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,  
  imports: [CommonModule, FormsModule], 
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  usuario: string = '';
  password: string = '';
  mensaje: string = '';
  cargando: boolean = false;

  @Output() loginExitoso = new EventEmitter<Usuario>();

  login() {
    console.log('--- Intento de Login ---');
    
    if (!this.usuario.trim() || !this.password.trim()) {
      this.mensaje = '⚠️ Por favor, ingresa tus credenciales';
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    this.authService.login(this.usuario, this.password).subscribe({
      next: (user) => {
        console.log('✅ Respuesta exitosa del servidor:', user);
        this.cargando = false;
        if (user) {
          // 1. Emitimos el evento (esto es vital para que el Dashboard reciba los datos)
          this.loginExitoso.emit(user);
          // 2. Redirigimos según tu lógica anterior
          this.redirigirSegunRol(user.rol);
        } else {
          this.mensaje = 'Usuario o contraseña incorrectos';
        }
      },
      error: (err) => {
        console.error('❌ ERROR DETECTADO:', err);
        this.cargando = false;
        this.mensaje = err.message || 'Error de conexión con el servidor';
      },
      complete: () => console.log('--- Petición Finalizada ---')
    });
  }
  
  private redirigirSegunRol(rol: string) {
    console.log('Redirigiendo a Dashboard para el rol:', rol);
    
    /**
     * Si antes todos funcionaban entrando al Dashboard, 
     * debemos mantener esa ruta. El DashboardAdminComponent 
     * usará su método 'mostrarPorDefecto(rol)' para decidir 
     * si muestra la tabla de pedidos, ventas o cocina.
     */
    this.router.navigate(['/dashboard-admin']).then(success => {
      if (!success) {
        console.error('Error: No se pudo navegar al Dashboard. Revisa app.routes.ts');
      }
    });
  }
}