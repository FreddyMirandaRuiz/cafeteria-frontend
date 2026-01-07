import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, Usuario } from '../../services/usuario.service';

declare var bootstrap: any;

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  filtro: string = '';

  nuevoUsuario: Usuario = this.resetUser();
  usuarioEdit: Usuario = this.resetUser();
  
  cargando: boolean = false;

  // --- CONTADOR DINÁMICO ---
  get totalUsuarios(): number {
    return this.usuarios.length;
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private resetUser(): Usuario {
    return { nombre: '', usuario: '', password: '', rol: '' };
  }

  cargarUsuarios() {
    this.cargando = true;
    this.usuarioService.listar().subscribe({
      next: data => {
        this.usuarios = data;
        this.aplicarFiltro();
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  aplicarFiltro() {
    const busqueda = this.filtro.toLowerCase().trim();
    this.usuariosFiltrados = this.usuarios.filter(u => 
      u.nombre.toLowerCase().includes(busqueda) || 
      u.rol.toLowerCase().includes(busqueda)
    );
  }

  // --- VALIDACIÓN DE FORMULARIO COMPLETO ---
  formularioValido(): boolean {
    return (
      this.nuevoUsuario.nombre.trim().length > 0 &&
      this.nuevoUsuario.usuario.trim().length > 0 &&
      this.nuevoUsuario.password!.trim().length >= 4 && // Mínimo 4 caracteres
      this.nuevoUsuario.rol !== ''
    );
  }

  registrar() {
    if (!this.formularioValido()) return;

    this.cargando = true;
    this.usuarioService.registrar(this.nuevoUsuario).subscribe({
      next: () => {
        this.nuevoUsuario = this.resetUser();
        this.cargarUsuarios();
      },
      error: () => {
        alert('❌ Error: El usuario ya existe o faltan datos');
        this.cargando = false;
      }
    });
  }

  eliminar(id: number) {
    if (confirm('¿Realmente deseas eliminar este usuario?')) {
      this.usuarioService.eliminar(id).subscribe({
        next: () => this.cargarUsuarios()
      });
    }
  }

  abrirModal(usuario: Usuario) {
    this.usuarioEdit = { ...usuario }; 
    const modalElem = document.getElementById('modalEditarUsuario');
    if (modalElem) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElem);
      modalInstance.show();
    }
  }

  guardarCambios() {
    // Validación básica para edición
    if (!this.usuarioEdit.nombre.trim() || !this.usuarioEdit.usuario.trim()) {
      alert('Campos obligatorios incompletos');
      return;
    }

    this.usuarioService.actualizarUsuario(this.usuarioEdit).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.cerrarModal();
      },
      error: () => alert('Error al actualizar')
    });
  }

  cerrarModal() {
    const modalElem = document.getElementById('modalEditarUsuario');
    if (modalElem) {
      const modalInstance = bootstrap.Modal.getInstance(modalElem);
      if (modalInstance) modalInstance.hide();
    }
  }
}