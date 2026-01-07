import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, Usuario } from '../../services/auth.service'; // 👈 Ruta corregida

import { ProductosComponent } from '../productos/productos.component';
import { VentasComponent } from '../ventas/ventas.component';
import { HistorialComponent } from '../historial/historial.component';
import { PedidosComponent } from '../pedidos/pedidos.component';
import { CocinaComponent } from '../cocina/cocina.component';
import { UsuariosComponent } from '../usuarios/usuarios.component';
import { HistorialPedidosComponent } from '../historial-pedidos/historial-pedidos.component';
import { LoginComponent } from '../login/login.component';
import { InicioComponent } from '../inicio/inicio.component';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule,
	InicioComponent,
    ProductosComponent,
    VentasComponent,
    HistorialComponent,
    PedidosComponent,
    CocinaComponent,
    LoginComponent,
	UsuariosComponent,
	HistorialPedidosComponent
  ],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent {
  usuario: Usuario | null = null;
  mostrar: string = '';

  constructor(private authService: AuthService) {
    this.usuario = this.authService.obtenerUsuario();
    if (this.usuario) {
      this.mostrarPorDefecto(this.usuario.rol);
    }
  }

  onLogin(user: Usuario) {
    this.usuario = user;
    //this.authService.guardarUsuario(user);
    this.mostrarPorDefecto(user.rol);
  }

  mostrarPorDefecto(rol: string) {
	this.mostrar = 'inicio';
    //switch (rol.toLowerCase()) {
      //case 'admin': this.mostrar = 'productos'; break;
      //case 'cajero': this.mostrar = 'ventas'; break;
      //case 'mesero': this.mostrar = 'pedidos'; break;
      //case 'cocina': this.mostrar = 'cocina'; break;
     // default: this.mostrar = ''; break;
    //}
  }

  seleccionarModulo(modulo: string) {
    this.mostrar = modulo;
  }

  logout() {
    this.authService.logout();
    this.usuario = null;
    this.mostrar = '';
  }
}
