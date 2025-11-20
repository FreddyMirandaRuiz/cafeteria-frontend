import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ Necesario para *ngFor, *ngIf, pipes
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductoService, Producto } from '../../services/producto.service';
import { CarritoService } from '../../services/carrito.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tienda',
  standalone: true, // ✅ Indica que es componente independiente
  imports: [CommonModule, RouterModule, FormsModule], // ✅ Habilita *ngFor, *ngIf, etc.
  templateUrl: './tienda.component.html',
  styleUrls: ['./tienda.component.css']
})
export class TiendaComponent implements OnInit {
  productos: Producto[] = [];
  filtro: string = '';
  modalVisible: boolean = false;

  constructor(
    private productoService: ProductoService,
    private carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productoService.listar().subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (err) => {
        console.error('❌ Error al cargar productos:', err);
        alert('Error al cargar los productos.');
      }
    });
  }
  
  get productosFiltrados() {
      return this.productos.filter(p =>
        p.nombre.toLowerCase().includes(this.filtro.toLowerCase())
      );
    }

  agregarAlCarrito(p: Producto) {
    this.carritoService.agregar(p);
    alert(`🛒 ${p.nombre} añadido al carrito`);
  }

  verResenas(id: number) {
    this.router.navigate(['/resenas', id]);
  }
  
  abrirModal() {
     this.modalVisible = true;
   }

   cerrarModal() {
     this.modalVisible = false;
   }
}