import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Producto {
  id?: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria?: string;
  descripcion?: string;
}

export interface DetalleVenta {
  producto: Producto;
  cantidad: number;
  subtotal?: number;
}

export interface PagoInfo {
  metodo: 'tarjeta' | 'qr' | 'efectivo';
  detalles?: any;
}

export interface Venta {
  id?: number;
  cliente: string;
  tipoComprobante: 'boleta' | 'factura';
  numeroComprobante?: string;
  fecha?: string;
  ruc?: string;
  subtotal?: number;
  igv?: number;
  total?: number;
  detalles: DetalleVenta[];
  pago?: PagoInfo;
}

@Injectable({
  providedIn: 'root'
})
export class VentaService {

  private apiUrl = 'http://localhost:8080/api/ventas';

  constructor(private http: HttpClient) { }
  
  // 🔹 Listar todas las ventas

  listar(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.apiUrl);
  }
  
  // 🔹 Registrar nueva venta

  registrar(venta: Venta): Observable<Venta> {
    return this.http.post<Venta>(this.apiUrl, venta);
  }
  
  // 🔹 Obtener una venta por ID
    obtenerPorId(id: number): Observable<Venta> {
      return this.http.get<Venta>(`${this.apiUrl}/${id}`);
    }

    // 🔹 Eliminar una venta (si implementas en backend)
    eliminar(id: number): Observable<void> {
      return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // 🔹 Generar comprobante en PDF (opcional: backend puede generarlo)
    generarComprobante(venta: Venta): Observable<Blob> {
      return this.http.post(`${this.apiUrl}/comprobante`, venta, { responseType: 'blob' });
    }
}