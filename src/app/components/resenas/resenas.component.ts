import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResenaService } from '../../services/resena.service';
import { AuthClienteService } from '../../services/auth-cliente.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-resenas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resenas.component.html',
  styleUrls: ['./resenas.component.css']
})
export class ResenasComponent implements OnInit {
  productoId!: number;
  resenas: any[] = [];
  nombreCliente: string = '';
  comentario: string = '';
  calificacion: number = 5;

  constructor(
    private route: ActivatedRoute,
    private resenaService: ResenaService,
    private authCliente: AuthClienteService
  ) {}

  ngOnInit(): void {
    this.productoId = +this.route.snapshot.paramMap.get('id')!;
    this.listarResenas();

    this.nombreCliente = this.authCliente.obtenerNombre() || 'Anónimo';
  }

  listarResenas() {
    this.resenaService.listarPorProducto(this.productoId).subscribe({
      next: (data) => {
        // Ordenar de más recientes a más antiguos
        this.resenas = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      },
      error: (err) => console.error('Error al cargar reseñas', err)
    });
  }

  seleccionarCalificacion(valor: number) {
    this.calificacion = valor;
  }

  agregarResena() {
    if (!this.authCliente.estaLogueado()) {
      alert('Debes iniciar sesión para dejar una reseña');
      return;
    }

    const nuevaResena = {
      nombreCliente: this.nombreCliente,
      comentario: this.comentario,
      calificacion: this.calificacion,
      fecha: new Date().toISOString(),
      producto: { id: this.productoId }
    };

    this.resenaService.guardar(nuevaResena).subscribe({
      next: () => {
        alert('✅ Reseña enviada con éxito');
        this.comentario = '';
        this.calificacion = 5;
        this.listarResenas();
      },
      error: (err) => console.error('Error al guardar reseña', err)
    });
  }

  obtenerIniciales(nombre: string) {
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}