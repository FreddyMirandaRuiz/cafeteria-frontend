import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

// 🧾 Interfaz Sincronizada con el Backend
export interface DetallePedido {
  id?: number;
  nombreProducto: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  pedidoId?: number; 
}

@Injectable({
  providedIn: 'root'
})
export class DetallePedidoService {
  private http = inject(HttpClient);
  // Asegúrate de que esta URL coincida con tu DetallePedidoController en Java
  private apiUrl = 'http://localhost:8080/api/detalles-pedido'; 

  /** 🔹 Listar todos los detalles (útil para reportes de ventas) */
  listar(): Observable<DetallePedido[]> {
    return this.http.get<DetallePedido[]>(this.apiUrl).pipe(
      catchError(err => {
        console.error('❌ Error al listar detalles', err);
        return of([]);
      })
    );
  }

  /** 🔹 Obtener ítems de un pedido específico */
  listarPorPedido(pedidoId: number): Observable<DetallePedido[]> {
    return this.http.get<DetallePedido[]>(`${this.apiUrl}/pedido/${pedidoId}`).pipe(
      catchError(err => {
        console.error(`❌ Error en detalles del pedido ${pedidoId}`, err);
        return of([]);
      })
    );
  }

  /** * 💡 NOTA: El método crear() no se usará en el flujo principal del Mozo, 
   * ya que el PedidoService enviará el paquete completo.
   */
  crear(detalle: DetallePedido): Observable<DetallePedido> {
    return this.http.post<DetallePedido>(this.apiUrl, detalle);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}