import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CarritoService {

  private items: any[] = [];

  // 🔥 Observable para emitir la cantidad del carrito en tiempo real
  private cantidadSubject = new BehaviorSubject<number>(0);
  cantidad$ = this.cantidadSubject.asObservable();

  constructor() {}

  private actualizarCantidad() {
    const cantidadTotal = this.items.reduce((sum, p) => sum + p.cantidad, 0);
    this.cantidadSubject.next(cantidadTotal);
  }

  agregar(producto: any) {
    const item = this.items.find(p => p.id === producto.id);

    if (item) {
      item.cantidad++;
    } else {
      this.items.push({ ...producto, cantidad: 1 });
    }

    this.actualizarCantidad();
  }

  listar() {
    return this.items;
  }

  total() {
    return this.items.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  }

  limpiar() {
    this.items = [];
    this.actualizarCantidad();
  }
}