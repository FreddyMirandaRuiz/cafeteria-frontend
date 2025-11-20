import { Injectable } from '@angular/core';
import SockJS from 'sockjs-client/dist/sockjs';
import * as Stomp from '@stomp/stompjs';
import { Pedido } from './pedido.service';

@Injectable({
  providedIn: 'root'
})
export class CocinaService {
  private stompClient: any = null;
  private conectado = false;

  conectar(onMensaje: (pedido: Pedido | string) => void) {
    if (this.conectado) {
      console.warn('⚠️ Ya estás conectado al canal de cocina');
      return;
    }

    const socket = new SockJS('http://localhost:8080/ws-cafeteria');
    this.stompClient = Stomp.over(socket);

    this.stompClient.connect({}, (frame: any) => {
      this.conectado = true;
      console.log('✅ Conectado al canal de cocina');

      // Escucha de mensajes del backend
      this.stompClient?.subscribe('/topic/cocina', (mensaje: any) => {
        try {
          const data = JSON.parse(mensaje.body);
          onMensaje(data);
        } catch {
          onMensaje(mensaje.body);
        }
      });
    }, (error: any) => {
      console.error('❌ Error al conectar con el servidor WebSocket:', error);
      this.conectado = false;

      // Intento de reconexión automática tras 5 segundos
      setTimeout(() => {
        console.log('🔄 Reintentando conexión con el canal de cocina...');
        this.conectar(onMensaje);
      }, 5000);
    });
  }

  /**
   * ✅ Envía una notificación al backend cuando un pedido es servido
   */
  notificarPedidoServido(pedido: Pedido) {
    if (!pedido.id) return;

    const mensaje = { id: pedido.id, estado: 'SERVIDO' };

    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send('/app/pedido-servido', {}, JSON.stringify(mensaje));
      console.log(`🍽️ Pedido servido notificado al backend (ID: ${pedido.id})`);
    } else {
      console.warn('⚠️ WebSocket no está conectado, no se pudo notificar el pedido servido.');
    }
  }

  desconectar() {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
        console.log('❌ Desconectado del canal de cocina');
        this.conectado = false;
      });
    }
  }

  isConectado(): boolean {
    return this.conectado;
  }
}