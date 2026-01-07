import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Servicios e Interfaces
import { AuthService, Usuario } from '../../services/auth.service';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { CocinaService } from '../../services/cocina.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { DetallePedido } from '../../services/detalle-pedido.service'; // <--- Importación verificada

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit {
  // Inyección de servicios moderna (Angular 16+)
  private authService = inject(AuthService);
  private pedidoService = inject(PedidoService);
  private cocinaService = inject(CocinaService);
  private productoService = inject(ProductoService);

  // Datos de usuario y listas
  usuario: Usuario | null = null;
  mozoNombre: string = '';
  pedidos: Pedido[] = [];
  productos: Producto[] = [];
  
  // Carrito y Filtros
  carrito: DetallePedido[] = [];
  filtroBusqueda: string = '';
  filtroEstado: string = 'todos';
  
  // Audio y UI
  audioBell = new Audio('assets/sounds/bell.mp3');
  montoSubtotal = 0;
  montoIgv = 0;
  montoTotal = 0;
  igvRate = 0.18;

  mostrarToast = false;
  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';

  // Dashboard de estados
  contadores = { pendiente: 0, preparacion: 0, listo: 0, servido: 0, entregado: 0 };
  progresoAnimado = 0;
  fechaActual: Date = new Date();

  // Objeto para nueva orden
  nuevoPedido: Pedido = {
    mozo: '', 
    mesa: '', 
    productos: '', 
    cantidad: 0, 
    total: 0, 
    estado: 'pendiente', 
    detalles: []
  };
  
  manejarErrorImagen(event: any) {
    event.target.src = 'assets/default-food.png';
  }

  @Output() logoutEvent = new EventEmitter<void>();

  ngOnInit(): void {
    // 1. Obtener datos del Mozo
    this.usuario = this.authService.obtenerUsuario();
    if (this.usuario) {
      this.mozoNombre = this.usuario.rol?.toLowerCase() === 'mesero' ? this.usuario.nombre : 'Admin';
    }

    // 2. Cargar datos iniciales
    this.cargarDatos();

    // 3. Reloj en tiempo real para el diseño elegante
    setInterval(() => this.fechaActual = new Date(), 1000);

    // 4. Suscripción WebSocket (Cocina -> Mozo)
    this.cocinaService.conectar((data) => {
      if (typeof data !== 'string') {
        const index = this.pedidos.findIndex((p) => p.id === data.id);
        
        // Notificación sonora: Solo si el pedido pasa a "listo para servir"
        if (data.estado === 'listo para servir' && (index === -1 || this.pedidos[index].estado !== 'listo para servir')) {
          this.notificarPedidoListo(data.mesa);
        }

        if (index !== -1) this.pedidos[index] = data;
        else this.pedidos.unshift(data); // Agregar al inicio si es nuevo
        
        this.recalcularContadores();
        this.actualizarProgreso();
      }
    });
  }

  cargarDatos() {
    this.pedidoService.obtenerPedidos().subscribe(data => {
      this.pedidos = data || [];
      this.recalcularContadores();
      this.actualizarProgreso();
    });
    this.productoService.listar().subscribe(data => this.productos = data || []);
  }
  
  // --- Lógica del Carrito (Optimizado) ---
  // En pedidos.component.ts revisa que esté así:
  agregarAlCarrito(producto: Producto) {
    const itemExistente = this.carrito.find(item => item.nombreProducto === producto.nombre);
    if (itemExistente) {
      itemExistente.cantidad++;
      itemExistente.subtotal = Number((itemExistente.cantidad * itemExistente.precio).toFixed(2));
    } else {
      this.carrito.push({
        nombreProducto: producto.nombre,
        cantidad: 1,
        precio: producto.precio,
        subtotal: producto.precio
      });
    }
    // ESTA LÍNEA ES VITAL:
    this.carrito = [...this.carrito]; 
    this.calcularTotalesCarrito();
  }
  
  cambiarCantidad(index: number, delta: number) {
    const item = this.carrito[index];
    if (item) {
      const nuevaCantidad = item.cantidad + delta;
      
      if (nuevaCantidad > 0) {
        item.cantidad = nuevaCantidad;
        // Forzamos el subtotal a tener 2 decimales para evitar errores de precisión
        item.subtotal = Number((item.cantidad * item.precio).toFixed(2));
        
        // IMPORTANTE: Creamos una nueva referencia del carrito para que Angular 
        // detecte el cambio si usas ChangeDetectionStrategy.OnPush
        this.carrito = [...this.carrito];
        
        this.calcularTotalesCarrito();
      }
    }
  }

  quitarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotalesCarrito();
  }

  calcularTotalesCarrito() {
    // Calculamos la suma de subtotales
    this.montoSubtotal = this.carrito.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    
    // Redondeo a 2 decimales para evitar números como 10.00000000004
    this.montoSubtotal = Number(this.montoSubtotal.toFixed(2));
    this.montoIgv = Number((this.montoSubtotal * this.igvRate).toFixed(2));
    this.montoTotal = Number((this.montoSubtotal + this.montoIgv).toFixed(2));
  }

  // --- Operaciones de Backend ---
  confirmarPedidoCompleto() {
    if (!this.nuevoPedido.mesa?.trim()) {
      this.mostrarToastMensaje('❌ Por favor, asigne una mesa', 'error');
      return;
    }

    if (this.carrito.length === 0) {
      this.mostrarToastMensaje('❌ El carrito está vacío', 'error');
      return;
    }

    const pedidoFinal: Pedido = {
      mozo: this.mozoNombre,
      mesa: this.nuevoPedido.mesa,
      // El backend también generará esto, pero lo enviamos para consistencia
      productos: this.carrito.map(i => `${i.cantidad} ${i.nombreProducto}`).join(', '),
      cantidad: this.carrito.reduce((acc, i) => acc + i.cantidad, 0),
      total: parseFloat(this.montoTotal.toFixed(2)),
      estado: 'pendiente',
      detalles: [...this.carrito]
    };

    this.pedidoService.crearPedido(pedidoFinal).subscribe({
      next: (creado) => {
        this.pedidos.unshift(creado);
        this.mostrarToastMensaje('✅ Pedido enviado con éxito', 'success');
        this.limpiarFormulario();
        this.recalcularContadores();
      },
      error: () => this.mostrarToastMensaje('❌ Error al procesar pedido', 'error')
    });
  }

  limpiarFormulario() {
    this.carrito = [];
    this.nuevoPedido.mesa = '';
    this.calcularTotalesCarrito();
  }

  cambiarEstado(pedido: Pedido, estado: string) {
    if (!pedido.id) return;
    this.pedidoService.actualizarEstado(pedido.id, estado).subscribe({
      next: (actualizado) => {
        pedido.estado = actualizado.estado;
        this.recalcularContadores();
        if (estado === 'servido') this.cocinaService.notificarPedidoServido(pedido);
      }
    });
  }

  eliminarPedido(pedido: Pedido) {
    if (!pedido.id || !confirm('¿Desea eliminar este pedido permanentemente?')) return;
    this.pedidoService.eliminarPedido(pedido.id).subscribe(() => {
      this.pedidos = this.pedidos.filter(p => p.id !== pedido.id);
      this.recalcularContadores();
      this.mostrarToastMensaje('Pedido eliminado', 'success');
    });
  }

  // --- Helpers de UI ---
  notificarPedidoListo(mesa: string) {
    this.audioBell.play().catch(() => console.log('Interacción requerida para audio'));
    this.mostrarToastMensaje(`🔔 ¡MESA ${mesa} LISTA PARA SERVIR!`, 'success');
  }

  mostrarToastMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = texto; 
    this.tipoMensaje = tipo; 
    this.mostrarToast = true;
    setTimeout(() => this.mostrarToast = false, 3500);
  }

  recalcularContadores() {
    this.contadores.pendiente = this.pedidos.filter(p => p.estado === 'pendiente').length;
    this.contadores.preparacion = this.pedidos.filter(p => p.estado === 'en preparación').length;
    this.contadores.listo = this.pedidos.filter(p => p.estado === 'listo para servir').length;
    this.contadores.servido = this.pedidos.filter(p => p.estado === 'servido').length;
    this.contadores.entregado = this.pedidos.filter(p => p.estado === 'entregado').length;
  }

  actualizarProgreso() {
    if (this.pedidos.length === 0) { this.progresoAnimado = 0; return; }
    const completados = this.pedidos.filter(p => p.estado === 'entregado').length;
    this.progresoAnimado = (completados / this.pedidos.length) * 100;
  }

  get productosFiltrados() {
    if (!this.filtroBusqueda) return this.productos;
    return this.productos.filter(p => 
      p.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
    );
  }

  get pedidosFiltrados() {
    const lista = this.filtroEstado === 'todos' 
      ? this.pedidos 
      : this.pedidos.filter(p => p.estado === this.filtroEstado);
    return lista.sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  cerrarSesion() {
    this.authService.logout();
    this.logoutEvent.emit();
  }
}