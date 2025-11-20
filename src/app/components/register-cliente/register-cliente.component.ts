import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthClienteService } from '../../services/auth-cliente.service';

@Component({
  selector: 'app-register-cliente',
  standalone: true, // ✅ componente independiente
  imports: [CommonModule, FormsModule, RouterModule], // ✅ necesario para ngModel y directivas
  templateUrl: './register-cliente.component.html',
  styleUrls: ['./register-cliente.component.css']
})
export class RegisterClienteComponent {
  nombre = '';
  email = '';
  password = '';

  constructor(private auth: AuthClienteService, private router: Router) {}

  registrar() {
    const cliente = {
      nombre: this.nombre,
      email: this.email,
      password: this.password
    };

    this.auth.register(cliente).subscribe({
      next: () => {
        alert('✅ Registro exitoso');
        this.router.navigate(['/login-cliente']);
      },
      error: (err) => {
        console.error('❌ Error al registrar cliente:', err);
        alert('Error al registrarse. Inténtalo de nuevo.');
      }
    });
  }
}