import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';

// ✅ Interfaz para los detalles de cada producto dentro del pedido
export interface DetallePedido {
  id?: number;
  nombreProducto?: string;
  cantidad: number;
  precio?: number;
  subtotal?: number;

  // Si el backend envía un objeto producto:
  producto?: {
    nombre?: string;
    precio?: number;
  };
}

// ✅ Interfaz principal del pedido
export interface Pedido {
  id?: number;
  mesa: string;
  productos?: string;
  cantidad?: number;
  total?: number;
  estado?: string;
  mozo?: string;
  fecha?: string;
  detalles?: DetallePedido[];
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = 'http://localhost:8080/api/pedidos';

  constructor(private http: HttpClient) {}

  // 🔹 Obtener todos los pedidos
  obtenerPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl).pipe(
      catchError(err => {
        console.error('❌ Error al obtener pedidos', err);
        return of([]);
      })
    );
  }

  // 🔹 Crear un nuevo pedido
  crearPedido(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, pedido).pipe(
      catchError(err => {
        console.error('❌ Error al crear pedido', err);
        return throwError(() => err);
      })
    );
  }

  // ✅ Actualizar el estado del pedido (cambio a PATCH y URL correcta)
  actualizarEstado(id: number, estado: string): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.apiUrl}/${id}/estado`, { estado }).pipe(
      catchError(err => {
        console.error(`❌ Error al actualizar estado del pedido ${id}`, err);
        return throwError(() => err);
      })
    );
  }

  // 🔹 Eliminar un pedido
  eliminarPedido(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        console.error(`❌ Error al eliminar pedido ${id}`, err);
        return throwError(() => err);
      })
    );
  }

  // 🔹 Obtener detalles de un pedido específico (opcional)
  obtenerDetallesPorPedido(id: number): Observable<DetallePedido[]> {
    return this.http.get<DetallePedido[]>(`${this.apiUrl}/${id}/detalles`).pipe(
      catchError(err => {
        console.error(`❌ Error al obtener detalles del pedido ${id}`, err);
        return of([]);
      })
    );
  }
}