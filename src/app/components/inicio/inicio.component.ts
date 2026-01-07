import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, Usuario } from '../../services/auth.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  usuario: Usuario | null = null;
  saludo: string = '';
  fechaActual: Date = new Date();
  modalVisible: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.usuario = this.authService.obtenerUsuario();
    const hora = new Date().getHours();
    if (hora < 12) this.saludo = '¡Buenos días! ☀️';
    else if (hora < 19) this.saludo = '¡Buenas tardes! ☕';
    else this.saludo = '¡Buenas noches! 🌙';
  }

  abrirModal() { this.modalVisible = true; }
  cerrarModal() { this.modalVisible = false; }

}