import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RouterModule, Router } from '@angular/router';
import { AuthService, Usuario } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,  
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  usuario: string = '';
  password: string = '';
  mensaje: string = '';

  @Output() loginExitoso = new EventEmitter<Usuario>();

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (!this.usuario || !this.password) {
      this.mensaje = 'Por favor ingresa usuario y contraseña';
      return;
    }

    this.authService.login(this.usuario, this.password).subscribe({
      next: (user: Usuario | null) => {
        if (user) {
          this.authService.guardarUsuario(user);
          this.mensaje = '';
          this.loginExitoso.emit(user); // Emitir evento al padre
		  this.router.navigate(['/dashboard-admin']);
        } else {
          this.mensaje = 'Usuario o contraseña incorrectos';
        }
      },
      error: () => this.mensaje = 'Error en el servidor'
    });
  }
}