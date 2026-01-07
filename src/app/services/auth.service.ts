import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface Usuario {
  id?: number;
  nombre: string;
  usuario: string;
  rol: 'admin' | 'cajero' | 'mesero' | 'cocina';
  token?: string; // Por si decides usar JWT en el futuro
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/auth';
  
  // 1. Estado reactivo del usuario
  private usuarioSubject = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioDeAlmacen());
  public usuario$ = this.usuarioSubject.asObservable();

  constructor() {}

  // --- LOGIN CON VALIDACIONES ---
  login(usuario: string, password: string): Observable<Usuario | null> {
    // Validación de entrada antes de disparar el HTTP
    if (!usuario.trim() || !password.trim()) {
      return throwError(() => new Error('Campos obligatorios vacíos'));
    }

    return this.http.post<Usuario>(`${this.baseUrl}/login`, { usuario, password }).pipe(
      tap(user => {
        if (user) {
          this.guardarUsuario(user);
          this.usuarioSubject.next(user); // Notificar a toda la app
        }
      }),
      catchError(this.handleError)
    );
  }

  // --- PERSISTENCIA SEGURA ---
  private guardarUsuario(usuario: Usuario): void {
    // Usamos una llave específica para el personal
    localStorage.setItem('staff_session', JSON.stringify(usuario));
  }

  private obtenerUsuarioDeAlmacen(): Usuario | null {
    const data = localStorage.getItem('staff_session');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      this.logout();
      return null;
    }
  }

  obtenerUsuario(): Usuario | null {
    return this.usuarioSubject.value;
  }

  // --- CIERRE DE SESIÓN ---
  logout(): void {
    localStorage.removeItem('staff_session');
    this.usuarioSubject.next(null); // Notificar que ya no hay usuario
  }

  // --- VALIDACIONES DE ROL ---
  estaAutenticado(): boolean {
    return !!this.usuarioSubject.value;
  }

  tieneRol(rol: string): boolean {
    const user = this.usuarioSubject.value;
    return user ? user.rol === rol : false;
  }

  esAdmin(): boolean {
    return this.tieneRol('admin');
  }

  // --- MANEJADOR DE ERRORES HTTP ---
  private handleError(error: HttpErrorResponse) {
    let mensaje = 'Ocurrió un error inesperado';
    if (error.status === 401) mensaje = 'Credenciales inválidas';
    if (error.status === 403) mensaje = 'No tienes permisos para acceder aquí';
    if (error.status === 0) mensaje = 'No hay conexión con el servidor';
    
    return throwError(() => new Error(mensaje));
  }
}