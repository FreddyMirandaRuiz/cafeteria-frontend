import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Producto {
  id?: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  descripcion?: string;
  imagen?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private apiUrl = 'http://localhost:8080/api/productos';

  constructor(private http: HttpClient) { }

  // Listar todos los productos
  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl)
      .pipe(catchError(err => throwError(() => err)));
  }

  // Guardar producto con imagen
  guardarConImagen(formData: FormData): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, formData)
      .pipe(catchError(err => throwError(() => err)));
  }

  // Actualizar producto con imagen opcional
  actualizarConImagen(id: number, formData: FormData): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, formData)
      .pipe(catchError(err => throwError(() => err)));
  }

  // Eliminar producto
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(err => throwError(() => err)));
  }
}
