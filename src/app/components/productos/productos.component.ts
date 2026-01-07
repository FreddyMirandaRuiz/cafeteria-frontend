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

  nuevoProducto: Producto = {
    nombre: '', precio: 0, stock: 0, categoria: '', descripcion: '', imagen: ''
  };

  editarProducto: Producto | null = null;

  archivoSeleccionado: File | null = null;
  previewImagen: string | ArrayBuffer | null = null;

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  // =====================
  // 1️⃣ LISTAR PRODUCTOS
  // =====================
  cargarProductos() {
    this.productoService.listar().subscribe({
      next: data => {
        this.productos = data;
        this.productosFiltrados = data;
      },
      error: err => console.error('Error al listar productos:', err)
    });
  }

  // =====================
  // 2️⃣ FILTRAR PRODUCTOS
  // =====================
  filtrarProductos() {
    const termino = this.busqueda.toLowerCase();

    this.productosFiltrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(termino) ||
      p.categoria.toLowerCase().includes(termino)
    );
  }

  // ============================================
  // 3️⃣ SELECCIONAR IMAGEN + PREVIEW EN AMBOS FORM
  // ============================================
  onArchivoSeleccionado(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.archivoSeleccionado = file;

    const reader = new FileReader();
    reader.onload = () => this.previewImagen = reader.result;
    reader.readAsDataURL(file);
  }

  // ============================================
  // 🔒 VALIDACIONES REUTILIZABLES
  // ============================================
  validarProducto(prod: Producto): boolean {
    if (!prod.nombre.trim()) return alert("El nombre es obligatorio"), false;
    if (prod.precio <= 0) return alert("El precio debe ser mayor a 0"), false;
    if (prod.stock < 0) return alert("El stock no puede ser negativo"), false;
    if (!Number.isInteger(prod.stock)) return alert("El stock debe ser un número entero"), false;
    if (!prod.categoria.trim()) return alert("La categoría es obligatoria"), false;

    return true;
  }

  // ============================================
  // 4️⃣ GUARDAR NUEVO PRODUCTO
  // ============================================
  guardarProducto() {

    if (!this.validarProducto(this.nuevoProducto)) return;

    const formData = new FormData();
    formData.append('nombre', this.nuevoProducto.nombre);
    formData.append('precio', this.nuevoProducto.precio.toString());
    formData.append('stock', this.nuevoProducto.stock.toString());
    formData.append('categoria', this.nuevoProducto.categoria);
    formData.append('descripcion', this.nuevoProducto.descripcion || '');

    if (this.archivoSeleccionado)
      formData.append('imagen', this.archivoSeleccionado);

    this.productoService.guardarConImagen(formData).subscribe({
      next: () => {
        alert('✅ Producto agregado correctamente');
        this.reiniciarFormulario();
        this.cargarProductos();
      },
      error: err => {
        console.error('Error al guardar producto:', err);
        alert('❌ Error al guardar producto');
      }
    });
  }

  // Reseteo de form
  reiniciarFormulario() {
    this.nuevoProducto = { nombre: '', precio: 0, stock: 0, categoria: '', descripcion: '', imagen: '' };
    this.archivoSeleccionado = null;
    this.previewImagen = null;
  }

  // ============================================
  // 5️⃣ ABRIR MODAL EDITAR
  // ============================================
  abrirModal(prod: Producto) {
    this.editarProducto = { ...prod };
    this.previewImagen = prod.imagen ? `http://localhost:8080/uploads/${prod.imagen}` : null;

    const modal = new bootstrap.Modal(document.getElementById('modalEditarProducto'));
    modal.show();
  }

  // ============================================
  // 6️⃣ GUARDAR EDICIÓN
  // ============================================
  guardarModificacion() {
    if (!this.editarProducto) return;

    if (!this.validarProducto(this.editarProducto)) return;

    const formData = new FormData();
    formData.append('nombre', this.editarProducto.nombre);
    formData.append('precio', this.editarProducto.precio.toString());
    formData.append('stock', this.editarProducto.stock.toString());
    formData.append('categoria', this.editarProducto.categoria);
    formData.append('descripcion', this.editarProducto.descripcion || '');

    if (this.archivoSeleccionado)
      formData.append('imagen', this.archivoSeleccionado);

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

  // ============================================
  // 7️⃣ ELIMINAR PRODUCTO
  // ============================================
  eliminarProducto(id: number) {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

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