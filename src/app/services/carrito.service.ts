import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private items: any[] = [];

  agregar(producto: any) {
    const item = this.items.find(p => p.id === producto.id);
    if (item) {
      item.cantidad++;
    } else {
      this.items.push({ ...producto, cantidad: 1 });
    }
  }

  listar() {
    return this.items;
  }

  total() {
    return this.items.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  }

  limpiar() {
    this.items = [];
  }
}