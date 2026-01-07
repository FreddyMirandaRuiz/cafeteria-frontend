import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';

// ✅ Interfaz para los detalles del carrito
export interface DetallePedido {
  id?: number;
  nombreProducto: string; // Obligatorio para el backend
  cantidad: number;
  precio: number;
  subtotal: number;
}

// ✅ Interfaz principal del pedido sincronizada con el Model Java
export interface Pedido {
  id?: number;
  mesa: string;
  productos?: string; // El backend lo generará, pero el front puede enviarlo vacío
  cantidad?: number;
  total: number;
  estado?: string;
  mozo: string;
  fecha?: string;
  detalles: DetallePedido[]; // Ahora es el corazón del pedido
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/pedidos';

  constructor() {}

  /** 🔹 Obtener todos los pedidos */
  obtenerPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl).pipe(
      catchError(this.handleError<Pedido[]>('obtenerPedidos', []))
    );
  }

  /** 🔹 Crear un nuevo pedido completo con carrito */
  crearPedido(pedido: Pedido): Observable<Pedido> {
    // El backend espera un objeto Pedido con una lista de detalles
    return this.http.post<Pedido>(this.apiUrl, pedido).pipe(
      catchError(this.handleError<Pedido>('crearPedido'))
    );
  }

  /** ✅ Actualizar el estado (Sincronizado con PutMapping en Java) */
  actualizarEstado(id: number, estado: string): Observable<Pedido> {
    // Enviamos el Map { "estado": "nuevoEstado" } como espera el controlador
    return this.http.put<Pedido>(`${this.apiUrl}/${id}/estado`, { estado }).pipe(
      catchError(this.handleError<Pedido>('actualizarEstado'))
    );
  }

  /** 🔹 Eliminar un pedido */
  eliminarPedido(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError<void>('eliminarPedido'))
    );
  }

  /** * 🛠️ Manejador de errores genérico
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`❌ Error en ${operation}:`, error.message);
      
      if (result !== undefined) {
        return of(result as T);
      }
      return throwError(() => new Error(error.message));
    };
  }
}