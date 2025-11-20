import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';

export interface Usuario {
  id?: number;
  nombre: string;
  usuario: string;
  password?: string; // no se necesita guardar password en frontend
  rol: 'admin' | 'cajero' | 'mesero' | 'cocina';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth'; // tu endpoint backend

  constructor(private http: HttpClient) {}

  login(usuario: string, password: string): Observable<Usuario | null> {
    return this.http.post<Usuario>(`${this.baseUrl}/login`, { usuario, password }).pipe(
      map(user => {
        if (user) {
          this.guardarUsuario(user);
          return user;
        }
        return null;
      })
    );
  }

  guardarUsuario(usuario: Usuario): void {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  obtenerUsuario(): Usuario | null {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }

  logout(): void {
    localStorage.removeItem('usuario');
  }

  estaAutenticado(): boolean {
    return this.obtenerUsuario() !== null;
  }

  tieneRol(rol: string): boolean {
    const usuario = this.obtenerUsuario();
    return usuario ? usuario.rol === rol : false;
  }
}