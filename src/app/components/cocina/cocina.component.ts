import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { CocinaService } from '../../services/cocina.service';

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cocina.component.html',
  styleUrls: ['./cocina.component.css']
})
export class CocinaComponent implements OnInit, OnDestroy {
  private pedidoService = inject(PedidoService);
  private cocinaService = inject(CocinaService);

  pedidos: Pedido[] = [];
  intervaloTiempos: any;

  ngOnInit(): void {
    this.cargarPedidos();
    
    // 📡 Conectar al WebSocket y escuchar actualizaciones
    this.cocinaService.conectar((data) => {
      if (typeof data !== 'string') {
        this.actualizarListaPedidos(data);
      }
    });

    // ⏱️ Refrescar la vista cada 30 segundos para actualizar los minutos transcurridos
    this.intervaloTiempos = setInterval(() => {
      // Forzamos una referencia nueva para que Angular refresque los pipes/funciones de tiempo
      this.pedidos = [...this.pedidos];
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.intervaloTiempos) clearInterval(this.intervaloTiempos);
    this.cocinaService.desconectar(); // Limpieza de conexión
  }

  cargarPedidos() {
    this.pedidoService.obtenerPedidos().subscribe(data => {
      // Filtramos los pedidos que no deben estar en la pantalla de cocina
      this.pedidos = data.filter(p => p.estado !== 'servido' && p.estado !== 'entregado');
    });
  }

  actualizarListaPedidos(pedido: Pedido) {
    const index = this.pedidos.findIndex(p => p.id === pedido.id);

    // 1. Si el pedido se marcó como servido o entregado, lo removemos
    if (pedido.estado === 'servido' || pedido.estado === 'entregado') {
      if (index !== -1) {
        this.pedidos = this.pedidos.filter(p => p.id !== pedido.id);
      }
      return;
    }

    // 2. Si el pedido ya existe, lo actualizamos (Inmutabilidad para detectar cambios)
    if (index !== -1) {
      this.pedidos[index] = { ...pedido };
      this.pedidos = [...this.pedidos]; // Dispara la detección de cambios de Angular
    } else {
      // 3. Si es un pedido nuevo, lo agregamos al principio
      this.pedidos = [{ ...pedido }, ...this.pedidos];
    }
  }

  // --- Acciones del Chef ---
  marcarPreparado(pedido: Pedido) {
    console.log('🔥 Iniciando preparación:', pedido.id);
    this.cocinaService.notificarPreparando(pedido);
  }

  marcarListo(pedido: Pedido) {
    console.log('🔔 Pedido listo:', pedido.id);
    this.cocinaService.notificarListo(pedido);
  }

  // --- Helpers de UI ---
  get resumenProduccion() {
    const totales: { [key: string]: number } = {};
    this.pedidos.forEach(p => {
      if (p.estado === 'pendiente' || p.estado === 'en preparación') {
        p.detalles?.forEach(det => {
          totales[det.nombreProducto] = (totales[det.nombreProducto] || 0) + det.cantidad;
        });
      }
    });
    return totales;
  }

  obtenerMinutos(fecha?: any): number {
    if (!fecha) return 0;
    // Manejo de fechas tanto en string como en formato Date
    const fechaPedido = new Date(fecha).getTime();
    const ahora = new Date().getTime();
    const diff = ahora - fechaPedido;
    return Math.floor(diff / 60000);
  }

  obtenerClaseUrgencia(pedido: Pedido): string {
    const min = this.obtenerMinutos(pedido.fecha);
    if (min >= 15) return 'urgencia-alta';  // Rojo
    if (min >= 8) return 'urgencia-media';  // Naranja/Amarillo
    return 'urgencia-baja';                 // Verde/Normal
  }
}