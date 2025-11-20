import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, Usuario } from '../../services/auth.service';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { CocinaService } from '../../services/cocina.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { DetallePedido } from '../../services/detalle-pedido.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit {
  private authService = inject(AuthService);
  private pedidoService = inject(PedidoService);
  private cocinaService = inject(CocinaService);
  private productoService = inject(ProductoService);

  usuario: Usuario | null = null;
  mozoNombre: string = '';
  pedidos: Pedido[] = [];
  productos: Producto[] = [];
  selectedProductId: number | null = null;

  precioUnitario = 0;
  subtotal = 0;
  igv = 0;
  totalConIGV = 0;
  igvRate = 0.18;

  mostrarToast = false;
  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';

  contadores = {
    pendiente: 0,
    preparacion: 0,
    listo: 0,
    servido: 0,
    entregado: 0
  };

  progresoAnimado = 0;

  nuevoPedido: Pedido = {
    mozo: '',
    mesa: '',
    productos: '',
    cantidad: 1,
    total: 0,
    estado: 'pendiente',
    detalles: []
  };

  @Output() logoutEvent = new EventEmitter<void>();

  ngOnInit(): void {
    this.usuario = this.authService.obtenerUsuario();
    if (this.usuario) {
      this.mozoNombre =
        this.usuario.rol?.toLowerCase() === 'mesero'
          ? this.usuario.nombre
          : this.usuario.rol?.toLowerCase() === 'admin'
          ? 'Administrador'
          : 'Usuario';
    }

    // Cargar pedidos y productos
    this.pedidoService.obtenerPedidos().subscribe({
      next: (data) => {
        this.pedidos = data || [];
        this.recalcularContadores();
        this.actualizarProgreso();
      },
      error: (err) => console.error('❌ Error cargando pedidos', err)
    });

    this.productoService.listar().subscribe({
      next: (data) => (this.productos = data || []),
      error: (err) => console.error('❌ Error cargando productos', err)
    });

    // Escuchar actualizaciones desde cocina
    this.cocinaService.conectar((data) => {
      if (typeof data !== 'string') {
        const index = this.pedidos.findIndex((p) => p.id === data.id);
        if (index !== -1) this.pedidos[index] = data;
        else this.pedidos.push(data);
        this.recalcularContadores();
        this.actualizarProgreso();
      }
    });
  }

  calcularTotal() {
    const producto = this.productos.find((p) => p.id === this.selectedProductId);
    const cantidad = this.nuevoPedido.cantidad || 0;

    if (producto && cantidad > 0) {
      this.precioUnitario = producto.precio;
      this.subtotal = this.precioUnitario * cantidad;
      this.igv = this.subtotal * this.igvRate;
      this.totalConIGV = this.subtotal + this.igv;

      this.nuevoPedido.total = parseFloat(this.totalConIGV.toFixed(2));
      this.nuevoPedido.productos = producto.nombre;
    } else {
      this.precioUnitario = this.subtotal = this.igv = this.totalConIGV = 0;
      this.nuevoPedido.total = 0;
    }
  }

  crearPedido() {
	// ✅ Validaciones antes de crear el pedido
	  if (!this.selectedProductId) {
	    this.mostrarToastMensaje('❌ Debes seleccionar un producto.', 'error');
	    return;
	  }

	  if (!this.nuevoPedido.cantidad || this.nuevoPedido.cantidad <= 0) {
	    this.mostrarToastMensaje('❌ La cantidad debe ser mayor a 0.', 'error');
	    return;
	  }
	  if (!this.nuevoPedido.mesa?.trim()) {
	      this.mostrarToastMensaje('❌ Debes ingresar el número de mesa.', 'error');
	      return;
	    }
    this.calcularTotal();
    this.nuevoPedido.mozo = this.mozoNombre;
    this.nuevoPedido.estado = 'pendiente';

    // ✅ Agregar los detalles directamente al pedido
    const producto = this.productos.find(p => p.id === this.selectedProductId);
    if (producto) {
      const detalle: DetallePedido = {
        nombreProducto: producto.nombre,
        cantidad: this.nuevoPedido.cantidad || 1,
        precio: producto.precio,
        subtotal: this.subtotal
      };
      this.nuevoPedido.detalles = [detalle];
    }

    // ✅ Enviar pedido completo (con detalles) al backend
    this.pedidoService.crearPedido(this.nuevoPedido).subscribe({
      next: (pedidoCreado) => {
        this.pedidos.push(pedidoCreado);
        this.mostrarToastMensaje('✅ Pedido registrado correctamente.', 'success');
        this.recalcularContadores();
        this.actualizarProgreso();

        // 🔄 Reiniciar campos
        this.nuevoPedido = {
          mozo: this.mozoNombre,
          mesa: '',
          productos: '',
          cantidad: 1,
          total: 0,
          estado: 'pendiente',
          detalles: []
        };
        this.selectedProductId = null;
        this.precioUnitario = this.subtotal = this.igv = this.totalConIGV = 0;
      },
      error: () => this.mostrarToastMensaje('❌ Error al registrar pedido.', 'error')
    });
  }

  cambiarEstado(pedido: Pedido, estado: string) {
    if (!pedido.id) return;
    this.pedidoService.actualizarEstado(pedido.id, estado).subscribe({
      next: () => {
        pedido.estado = estado;
        this.mostrarToastMensaje(`🔄 Pedido #${pedido.id} cambiado a "${estado}".`, 'success');
        this.recalcularContadores();
        this.actualizarProgreso();
		// 🧠 NUEVO: Si el pedido fue marcado como "servido", avisamos a la cocina
		if (estado === 'servido') {
		  this.cocinaService.notificarPedidoServido(pedido);
		 }
      },
      error: () => this.mostrarToastMensaje('❌ Error al cambiar estado.', 'error')
    });
  }

  eliminarPedido(pedido: Pedido) {
    if (!pedido.id) return;
    this.pedidoService.eliminarPedido(pedido.id).subscribe({
      next: () => {
        this.pedidos = this.pedidos.filter((p) => p.id !== pedido.id);
        this.recalcularContadores();
        this.actualizarProgreso();
        this.mostrarToastMensaje(`🗑️ Pedido #${pedido.id} eliminado.`, 'error');
      },
      error: () => this.mostrarToastMensaje('❌ Error al eliminar pedido.', 'error')
    });
  }

  recalcularContadores() {
    this.contadores.pendiente = this.pedidos.filter(p => p.estado === 'pendiente').length;
    this.contadores.preparacion = this.pedidos.filter(p => p.estado === 'en preparación').length;
    this.contadores.listo = this.pedidos.filter(p => p.estado === 'listo para servir').length;
    this.contadores.servido = this.pedidos.filter(p => p.estado === 'servido').length;
    this.contadores.entregado = this.pedidos.filter(p => p.estado === 'entregado').length;
  }

  actualizarProgreso() {
    if (this.pedidos.length === 0) {
      this.progresoAnimado = 0;
      return;
    }
    const completados = this.pedidos.filter(p => p.estado === 'entregado').length;
    this.progresoAnimado = (completados / this.pedidos.length) * 100;
  }

  cerrarSesion() {
    this.authService.logout();
    this.logoutEvent.emit();
  }

  mostrarToastMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    this.mostrarToast = true;
    setTimeout(() => (this.mostrarToast = false), 3000);
  }
}