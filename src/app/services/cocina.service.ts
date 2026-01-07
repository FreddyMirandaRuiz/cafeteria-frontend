import { Injectable } from '@angular/core';
import { Pedido } from './pedido.service';
import  SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';

@Injectable({
  providedIn: 'root'
})
export class CocinaService {
  private stompClient: any;
  private conectado = false;

  /**
   * 📡 Inicia la conexión con el servidor
   * @param onMensaje Callback que se ejecuta cuando llega un cambio en los pedidos
   */
  conectar(onMensaje: (pedido: Pedido) => void) {
    if (this.conectado) return;

    // 1. Apuntamos al endpoint que definiste en el Backend
    const socket = new SockJS('http://localhost:8080/ws-cafeteria');
    this.stompClient = Stomp.over(socket);

    // Opcional: Desactivar los logs constantes de STOMP en la consola
    this.stompClient.debug = () => {};

    // 2. Intentar la conexión
    this.stompClient.connect({}, (frame: any) => {
      this.conectado = true;
      console.log('✅ ¡CONECTADO AL SISTEMA DE COCINA REAL-TIME!');

      // 3. Suscribirse al canal donde el mozo y la cocina escuchan cambios
      this.stompClient.subscribe('/topic/pedidos', (mensaje: any) => {
        if (mensaje.body) {
          const pedidoActualizado: Pedido = JSON.parse(mensaje.body);
          onMensaje(pedidoActualizado);
        }
      });
    }, (error: any) => {
      console.error('❌ Error en la conexión WebSocket:', error);
      this.conectado = false;
      // Reintento automático cada 5 segundos si se cae el servidor
      setTimeout(() => this.conectar(onMensaje), 5000);
    });
  }

  /**
   * 🔥 Acción del Chef: El pedido entra a la olla.
   */
  notificarPreparando(pedido: Pedido) {
    this.enviarMensaje('/app/preparar-pedido', pedido);
  }

  /**
   * 🔔 Acción del Chef: El plato está listo en la barra.
   */
  notificarListo(pedido: Pedido) {
    this.enviarMensaje('/app/pedido-listo', pedido);
  }

  /**
   * 🍽️ Acción del Mozo: El cliente ya tiene su comida.
   */
  notificarPedidoServido(pedido: Pedido) {
    this.enviarMensaje('/app/pedido-servido', pedido);
  }

  /**
   * 🛠️ Método privado para enviar datos de forma segura
   */
  private enviarMensaje(destino: string, data: Pedido) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(destino, {}, JSON.stringify(data));
      console.log(`📤 Mensaje enviado a ${destino} para Mesa: ${data.mesa}`);
    } else {
      console.error('⚠️ No se pudo enviar el mensaje. El socket no está conectado.');
    }
  }

  /**
   * Cierra la conexión al salir de la app
   */
  desconectar() {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        this.conectado = false;
        console.log('🔌 WebSocket desconectado.');
      });
    }
  }
}