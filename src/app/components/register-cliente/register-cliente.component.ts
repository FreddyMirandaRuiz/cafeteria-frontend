import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthClienteService } from '../../services/auth-cliente.service';

@Component({
  selector: 'app-register-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register-cliente.component.html',
  styleUrls: ['./register-cliente.component.css']
})
export class RegisterClienteComponent {

  nombre = '';
  email = '';
  password = '';
  confirmPassword = '';

  verPassword = false; // 👁️ Mostrar/ocultar contraseña
  verPassword2 = false;

  constructor(private auth: AuthClienteService, private router: Router) {}
  
  registrar() {
      // Validación de coincidencia
      if (this.password !== this.confirmPassword) {
        alert("⚠ Las contraseñas no coinciden.");
        return;
      }

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