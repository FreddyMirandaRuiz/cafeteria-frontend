import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ Necesario para *ngFor, *ngIf, pipes
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ProductoService, Producto } from '../../services/producto.service';
import { CarritoService } from '../../services/carrito.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tienda.component.html',
  styleUrls: ['./tienda.component.css']
})
export class TiendaComponent implements OnInit {
  productos: Producto[] = [];
  filtro: string = '';

  // PAGINACIÓN
  currentPage: number = 1;
  pageSize: number = 6; // productos por página

  modalVisible: boolean = false;

  constructor(
    private productoService: ProductoService,
    private carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos() {
    this.productoService.listar().subscribe({
      next: (data) => (this.productos = data),
      error: (err) => {
        console.error('Error al cargar productos:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar productos',
          text: 'Intenta nuevamente más tarde.'
        });
      }
    });
  }

  // FILTRO + PAGINACIÓN: devuelve solo los productos a mostrar en la página actual
  get productosFiltrados() {
    const texto = this.filtro?.toLowerCase().trim() || '';
    const filtrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(texto)
    );

    const inicio = (this.currentPage - 1) * this.pageSize;
    const fin = inicio + this.pageSize;
    return filtrados.slice(inicio, fin);
  }

  // total de páginas según el filtro actual
  get totalPaginas() {
    const texto = this.filtro?.toLowerCase().trim() || '';
    const totalFiltrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(texto)
    ).length;
    return Math.max(1, Math.ceil(totalFiltrados / this.pageSize));
  }

  cambiarPagina(num: number) {
    if (num >= 1 && num <= this.totalPaginas) {
      this.currentPage = num;
      // opcional: hacer scroll hacia arriba de la lista al cambiar de página
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  }

  agregarAlCarrito(producto: Producto) {
    this.carritoService.agregar(producto);
    Swal.fire({
      icon: 'success',
      title: 'Añadido al carrito',
      text: `${producto.nombre} fue agregado.`,
      timer: 1500,
      showConfirmButton: false
    });
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