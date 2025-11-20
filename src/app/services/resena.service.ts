import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResenaService {
  private baseURL = 'http://localhost:8080/api/resenas';

  constructor(private http: HttpClient) {}

  listarPorProducto(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseURL}/producto/${id}`);
  }

  guardar(resena: any): Observable<any> {
    return this.http.post<any>(this.baseURL, resena);
  }
}