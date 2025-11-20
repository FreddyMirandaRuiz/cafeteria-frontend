import { Component, OnInit, OnDestroy } from '@angular/core';
import SockJS from 'sockjs-client';
import { Client, Message } from '@stomp/stompjs';
import { CommonModule } from '@angular/common';
import { CocinaService } from '../../services/cocina.service';
import { PedidoService, Pedido } from '../../services/pedido.service';

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cocina.component.html',
  styleUrls: ['./cocina.component.css']
})
export class CocinaComponent implements OnInit, OnDestroy {
  pedidos: Pedido[] = [];

  constructor(
    private cocinaService: CocinaService,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    // 🔹 Cargar todos los pedidos iniciales
    this.pedidoService.obtenerPedidos().subscribe({
      next: (data) => {
        // Solo mostrar pedidos pendientes o en preparación
        this.pedidos = data.filter(p =>
          p.estado === 'pendiente' || p.estado === 'en preparación'
        );
      },
      error: (err) => console.error('❌ Error cargando pedidos', err)
    });

    // 🔹 Conectarse al canal WebSocket
    this.cocinaService.conectar((pedido: Pedido | string) => {
      console.log('📦 Pedido recibido en cocina:', pedido);

      if (typeof pedido === 'string') {
        console.warn('ℹ️ Notificación recibida:', pedido);
        return;
      }

      // 🧠 Ignorar pedidos servidos, entregados o cancelados
      if (pedido.estado === 'servido' || pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
        this.pedidos = this.pedidos.filter(p => p.id !== pedido.id);
        return;
      }

      // 🔹 Si el pedido ya existe, actualizarlo
      const index = this.pedidos.findIndex(p => p.id === pedido.id);
      if (index > -1) {
        this.pedidos[index] = pedido;
      } else {
        // 🔹 Agregar solo si está pendiente o en preparación
        if (pedido.estado === 'pendiente' || pedido.estado === 'en preparación') {
          this.pedidos.push(pedido);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.cocinaService.desconectar();
  }

  // 🔹 Cambiar estado a "en preparación"
  marcarPreparado(pedido: Pedido): void {
    this.pedidoService.actualizarEstado(pedido.id!, 'en preparación').subscribe({
      next: (actualizado) => pedido.estado = actualizado.estado,
      error: (err) => console.error('❌ Error actualizando estado', err)
    });
  }

  // 🔹 Cambiar estado a "listo para servir"
  marcarListo(pedido: Pedido): void {
    this.pedidoService.actualizarEstado(pedido.id!, 'listo para servir').subscribe({
      next: (actualizado) => pedido.estado = actualizado.estado,
      error: (err) => console.error('❌ Error actualizando estado', err)
    });
  }
}