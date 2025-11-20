import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

// 🧾 Interfaz de DetallePedido (idéntica a tu backend)
export interface DetallePedido {
  id?: number;
  nombreProducto: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  pedidoId?: number; // Relación con el pedido
}

@Injectable({
  providedIn: 'root'
})
export class DetallePedidoService {
  private apiUrl = 'http://localhost:8080/api/detalles-pedido';

  constructor(private http: HttpClient) {}

  // 🔹 Listar todos los detalles
  listar(): Observable<DetallePedido[]> {
    return this.http.get<DetallePedido[]>(this.apiUrl).pipe(
      catchError(err => {
        console.error('❌ Error al listar detalles de pedido', err);
        return of([]);
      })
    );
  }

  // 🔹 Listar detalles por ID de pedido
  listarPorPedido(pedidoId: number): Observable<DetallePedido[]> {
    return this.http.get<DetallePedido[]>(`${this.apiUrl}?pedidoId=${pedidoId}`).pipe(
      catchError(err => {
        console.error(`❌ Error al listar detalles del pedido ${pedidoId}`, err);
        return of([]);
      })
    );
  }

  // 🔹 Crear un nuevo detalle
  crear(detalle: DetallePedido): Observable<DetallePedido> {
    return this.http.post<DetallePedido>(this.apiUrl, detalle).pipe(
      catchError(err => {
        console.error('❌ Error al crear detalle de pedido', err);
        throw err;
      })
    );
  }

  // 🔹 Actualizar un detalle
  actualizar(id: number, detalle: DetallePedido): Observable<DetallePedido> {
    return this.http.put<DetallePedido>(`${this.apiUrl}/${id}`, detalle).pipe(
      catchError(err => {
        console.error(`❌ Error al actualizar detalle ${id}`, err);
        throw err;
      })
    );
  }

  // 🔹 Eliminar un detalle
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        console.error(`❌ Error al eliminar detalle ${id}`, err);
        throw err;
      })
    );
  }
}