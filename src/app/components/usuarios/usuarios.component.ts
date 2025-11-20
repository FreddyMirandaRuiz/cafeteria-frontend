import { Component, OnInit } from '@angular/core';
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
  usuarios: Usuario[] = [];
  nuevoUsuario: Usuario = { nombre: '', usuario: '', password: '', rol: '' };
  usuarioEdit: Usuario = { id: 0, nombre: '', usuario: '', password: '', rol: '' };

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuarioService.listar().subscribe({
      next: data => this.usuarios = data,
      error: err => console.error(err)
    });
  }

  registrar() {
    this.usuarioService.registrar(this.nuevoUsuario).subscribe({
      next: () => {
        alert('✅ Usuario registrado con éxito');
        this.nuevoUsuario = { nombre: '', usuario: '', password: '', rol: '' };
        this.cargarUsuarios();
      },
      error: () => alert('❌ Error al registrar usuario')
    });
  }

  eliminar(id: number) {
    if (confirm('¿Seguro de eliminar este usuario?')) {
      this.usuarioService.eliminar(id).subscribe({
        next: () => this.cargarUsuarios(),
        error: err => console.error(err)
      });
    }
  }

  // 🔹 Abrir modal con datos del usuario
  abrirModal(usuario: Usuario) {
    this.usuarioEdit = { ...usuario }; // Clonamos el usuario
    const modal = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));
    modal.show();
  }

  // 🔹 Guardar los cambios
  guardarCambios() {
    this.usuarioService.actualizarUsuario(this.usuarioEdit).subscribe({
      next: () => {
        alert('✅ Usuario actualizado correctamente');
        this.cargarUsuarios();
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarUsuario'));
        modal.hide();
      },
      error: () => alert('❌ Error al actualizar usuario')
    });
  }
}