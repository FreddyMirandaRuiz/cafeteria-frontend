import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthClienteService } from '../../services/auth-cliente.service';
import Swal from 'sweetalert2';

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
	
	if (!this.email || !this.password) {
	    Swal.fire({
	      icon: 'warning',
	      title: 'Campos incompletos',
	      text: 'Por favor complete todos los campos.',
	      confirmButtonColor: '#6f4e37'
	    });
	    return;
	  }
	
	  this.auth.login({ email: this.email, password: this.password }).subscribe({
	      next: (res) => {
	        if (res.token) {
	          this.auth.guardarToken(res.token);
	          this.auth.guardarNombre(res.nombre);

	          Swal.fire({
	            title: `☕ Bienvenido, ${res.nombre}!`,
	            text: 'Nos alegra tenerte nuevamente por aquí.',
	            icon: 'success',
	            confirmButtonText: 'Ir a la tienda',
	            confirmButtonColor: '#6f4e37',
	          }).then(() => {
	            this.router.navigate(['/tienda']);
	          });

	        } else {
	          Swal.fire({
	            icon: 'error',
	            title: 'Credenciales incorrectas',
	            text: 'Revise su correo y contraseña.',
	            confirmButtonColor: '#6f4e37'
	          });
	        }
	      },
	      error: (err) => {
	        console.error(err);

	        Swal.fire({
	          icon: 'error',
	          title: 'Error en el servidor',
	          text: 'Intente nuevamente en unos minutos.',
	          confirmButtonColor: '#6f4e37'
	        });
	      }
	    });  
    
  }
}