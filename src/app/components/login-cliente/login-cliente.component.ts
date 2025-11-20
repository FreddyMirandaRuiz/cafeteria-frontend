import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthClienteService } from '../../services/auth-cliente.service';

@Component({
  selector: 'app-login-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-cliente.component.html',
  styleUrls: ['./login-cliente.component.css']
})
export class LoginClienteComponent {
  email = '';
  password = '';

  constructor(private auth: AuthClienteService, private router: Router) {}

  login() {
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        if (res.token) {
          this.auth.guardarToken(res.token);
		  this.auth.guardarNombre(res.nombre);
          alert('✅ Bienvenido ' + res.nombre);
          this.router.navigate(['/tienda']);
        } else {
          alert('⚠️ Credenciales incorrectas');
        }
      },
      error: (err) => {
        console.error(err);
        alert('❌ Error en el servidor');
      }
    });
  }
}