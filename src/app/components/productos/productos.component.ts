import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ProductoService, Producto } from '../../services/producto.service';

declare var bootstrap: any;

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  busqueda: string = '';

  nuevoProducto: Producto = { nombre: '', precio: 0, stock: 0, categoria: '', descripcion: '', imagen: '' };
  editarProducto: Producto | null = null;

  archivoSeleccionado: File | null = null;
  previewImagen: string | ArrayBuffer | null = null;

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos() {
    this.productoService.listar().subscribe({
      next: data => {
        this.productos = data;
        this.productosFiltrados = data;
      },
      error: err => console.error('Error al listar productos:', err)
    });
  }

  filtrarProductos() {
    const termino = this.busqueda.toLowerCase();
    this.productosFiltrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(termino) ||
      p.categoria.toLowerCase().includes(termino)
    );
  }

  onArchivoSeleccionado(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
      const reader = new FileReader();
      reader.onload = e => this.previewImagen = reader.result;
      reader.readAsDataURL(file);
    }
  }

  guardarProducto() {
    if (!this.nuevoProducto.nombre.trim()) return alert('El nombre es obligatorio');
	if (this.nuevoProducto.precio <= 0) return alert('El precio debe ser mayor a 0');
	if (this.nuevoProducto.stock < 0) return alert('El stock no puede ser negativo');
	if (!Number.isInteger(this.nuevoProducto.stock)) return alert('El stock debe ser un número entero mayor o igual a 0');

    const formData = new FormData();
    formData.append('nombre', this.nuevoProducto.nombre);
    formData.append('precio', this.nuevoProducto.precio.toString());
    formData.append('stock', this.nuevoProducto.stock.toString());
    formData.append('categoria', this.nuevoProducto.categoria);
    formData.append('descripcion', this.nuevoProducto.descripcion || '');
    if (this.archivoSeleccionado) formData.append('imagen', this.archivoSeleccionado);

    this.productoService.guardarConImagen(formData).subscribe({
      next: () => {
        alert('✅ Producto agregado correctamente');
        this.nuevoProducto = { nombre: '', precio: 0, stock: 0, categoria: '', descripcion: '', imagen: '' };
        this.archivoSeleccionado = null;
        this.previewImagen = null;
        this.cargarProductos();
      },
      error: err => {
        console.error('Error al guardar producto:', err);
        alert('❌ Error al guardar producto');
      }
    });
  }

  abrirModal(prod: Producto) {
    this.editarProducto = { ...prod };
    this.previewImagen = prod.imagen ? `http://localhost:8080/uploads/${prod.imagen}` : null;
    const modal = new bootstrap.Modal(document.getElementById('modalEditarProducto'));
    modal.show();
  }

  guardarModificacion() {
    if (!this.editarProducto) return;
	// Validaciones
	if (!this.editarProducto.nombre.trim()) return alert('El nombre es obligatorio');

	if (this.editarProducto.precio <= 0) return alert('El precio debe ser mayor a 0');

	if (this.editarProducto.stock < 0) return alert('El stock no puede ser negativo');
	if (!Number.isInteger(this.editarProducto.stock)) return alert('El stock debe ser un número entero mayor o igual a 0');

    const formData = new FormData();
    formData.append('nombre', this.editarProducto.nombre);
    formData.append('precio', this.editarProducto.precio.toString());
    formData.append('stock', this.editarProducto.stock.toString());
    formData.append('categoria', this.editarProducto.categoria);
    formData.append('descripcion', this.editarProducto.descripcion || '');
    if (this.archivoSeleccionado) formData.append('imagen', this.archivoSeleccionado);

    this.productoService.actualizarConImagen(this.editarProducto.id!, formData).subscribe({
      next: () => {
        alert('✅ Producto actualizado correctamente');
        this.cargarProductos();
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarProducto'));
        modal.hide();
        this.archivoSeleccionado = null;
        this.previewImagen = null;
      },
      error: err => {
        console.error('Error al actualizar producto:', err);
        alert('❌ Error al actualizar producto');
      }
    });
  }
  
  eliminarProducto(id: number) {
      if (confirm('¿Seguro que deseas eliminar este producto?')) {
        this.productoService.eliminar(id).subscribe({
          next: () => {
            alert('🗑️ Producto eliminado');
            this.cargarProductos();
          },
          error: err => {
            console.error('Error al eliminar producto:', err);
            alert('❌ Error al eliminar producto');
          }
        });
      }
    }

  
}