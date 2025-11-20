import { Component, OnInit } from '@angular/core';
import { CarritoService } from '../../services/carrito.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthClienteService } from '../../services/auth-cliente.service';
import { Router } from '@angular/router';
declare var bootstrap: any;

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit {
  carrito: any[] = [];
  total = 0;
  metodoPago: string = '';

  constructor(
    private carritoService: CarritoService,
    private http: HttpClient,
    private authCliente: AuthClienteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carrito = this.carritoService.listar();
    this.total = this.carritoService.total();
  }

  realizarCompra() {
    const modal = new bootstrap.Modal(document.getElementById('modalPago'));
    modal.show();
  }

  seleccionarMetodo(metodo: string) {
    this.metodoPago = metodo;
  }

  confirmarPago() {
    const cliente = this.authCliente.obtenerNombre();
    const orden = {
      cliente,
      total: this.total,
	  metodoPago: this.metodoPago,
      detalles: this.carrito.map(p => ({
        productoId: p.id,
        nombreProducto: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad
      }))
    };

    this.http.post('http://localhost:8080/api/ordenes', orden).subscribe({
      next: () => {
        alert('Compra realizada con éxito ✅');
        this.carritoService.limpiar();
        this.router.navigate(['/mis-pedidos']);
      },
      error: () => alert('Error al registrar compra ❌')
    });
  }
}