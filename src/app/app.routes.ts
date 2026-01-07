import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ProductosComponent } from './components/productos/productos.component';
import { VentasComponent } from './components/ventas/ventas.component';
import { HistorialComponent } from './components/historial/historial.component';
import { PedidosComponent } from './components/pedidos/pedidos.component';
import { CocinaComponent } from './components/cocina/cocina.component';
import { DashboardAdminComponent } from './components/dashboard-admin/dashboard-admin.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { HistorialPedidosComponent } from './components/historial-pedidos/historial-pedidos.component';
import { authGuard } from './guards/auth.guard';
import { clienteGuard } from './guards/cliente.guard';

import { InicioComponent } from './components/inicio/inicio.component';

// 👇 Importamos los nuevos componentes
import { TiendaComponent } from './components/tienda/tienda.component';
import { CarritoComponent } from './components/carrito/carrito.component';
import { ResenasComponent } from './components/resenas/resenas.component';
import { LoginClienteComponent } from './components/login-cliente/login-cliente.component';
import { RegisterClienteComponent } from './components/register-cliente/register-cliente.component';
import { MisPedidosComponent } from './components/mis-pedidos/mis-pedidos.component';

export const routes: Routes = [
	
	// 🛍️ Sección pública (clientes)
	  { path: 'tienda', component: TiendaComponent },
	  { path: 'carrito', component: CarritoComponent, canActivate: [clienteGuard] },
	  { path: 'resenas/:id', component: ResenasComponent, canActivate: [clienteGuard] },
	  { path: 'login-cliente', component: LoginClienteComponent },
	  { path: 'register-cliente', component: RegisterClienteComponent },
	  { path: 'mis-pedidos', component: MisPedidosComponent, canActivate: [clienteGuard] },
	
	
	  // 🔐 Sistema administrativo
       { path: '', redirectTo: 'login', pathMatch: 'full' },
       { path: 'login', component: LoginComponent },
	   { path: 'dashboard-admin', component: DashboardAdminComponent, canActivate: [authGuard] },
	   { path: 'inicio', component: InicioComponent, canActivate: [authGuard] },
       { path: 'productos', component: ProductosComponent, canActivate: [authGuard] },
       { path: 'ventas', component: VentasComponent, canActivate: [authGuard] },
       { path: 'historial', component: HistorialComponent, canActivate: [authGuard] },
       { path: 'pedidos', component: PedidosComponent, canActivate: [authGuard] },
       { path: 'cocina', component: CocinaComponent, canActivate: [authGuard] },
	   { path: 'usuarios', component: UsuariosComponent, canActivate: [authGuard] },
	   { path: 'historial-pedidos', component: HistorialPedidosComponent, canActivate: [authGuard] },
	   
	   // 🚪 Página inicial por defecto
	   { path: '', redirectTo: 'tienda', pathMatch: 'full' },
  
  
       { path: '**', redirectTo: 'login' }
];