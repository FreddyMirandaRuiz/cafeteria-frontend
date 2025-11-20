import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthClienteService {

  private apiUrl = 'http://localhost:8080/api/auth-cliente';

  constructor(private http: HttpClient) {}

  // 🔹 LOGIN
  login(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, datos);
  }

  // 🔹 REGISTRO
  register(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, datos);
  }

  // 🔹 GUARDAR TOKEN Y NOMBRE
  guardarToken(token: string) {
    localStorage.setItem('tokenCliente', token);
  }

  guardarNombre(nombre: string) {
    localStorage.setItem('nombreCliente', nombre);
  }

  // 🔹 OBTENER DATOS DEL CLIENTE
  obtenerToken(): string | null {
    return localStorage.getItem('tokenCliente');
  }

  obtenerNombre(): string | null {
    return localStorage.getItem('nombreCliente');
  }

  // 🔹 VERIFICAR SESIÓN ACTIVA
  estaLogueado(): boolean {
    return !!this.obtenerToken(); // true si hay token
  }

  // 🔹 CERRAR SESIÓN
  cerrarSesion() {
    localStorage.removeItem('tokenCliente');
    localStorage.removeItem('nombreCliente');
  }
}