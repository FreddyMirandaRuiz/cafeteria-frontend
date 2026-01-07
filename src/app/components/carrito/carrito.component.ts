import { Component, OnInit } from '@angular/core';
import { CarritoService } from '../../services/carrito.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthClienteService } from '../../services/auth-cliente.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
declare var bootstrap: any;

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit {
  carrito: any[] = [];
  total = 0;
  metodoPago: string = '';
  
  // FORMULARIO DE TARJETA
    // -----------------------
    formTarjeta!: FormGroup;
    tipoTarjeta: string = '';
    iconoTarjeta: string = '';
    maxCVV: number = 3;

  constructor(
    private carritoService: CarritoService,
    private http: HttpClient,
    private authCliente: AuthClienteService,
    private router: Router,
	private fb: FormBuilder
  ) {}
  
  // Inicialización

  ngOnInit(): void {
    this.carrito = this.carritoService.listar();
    this.total = this.carritoService.total();
	
	this.formTarjeta = this.fb.group({
	      numero: ['', [Validators.required]],
	      titular: ['', [Validators.required]],
	      expiracion: ['', [Validators.required]],
	      cvv: ['', [Validators.required]]
	    });
  }
  
  volverTienda() {
    this.router.navigate(['/tienda']);
  }
  
  realizarCompra() {
    Swal.fire({
      title: "¿Deseas continuar con el pago?",
      text: "Serás redirigido al método de pago.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#8b4513",
      cancelButtonColor: "#6e320c"
    }).then((result: any) => {
      if (result.isConfirmed) {
        const modal = new bootstrap.Modal(document.getElementById('modalPago'));
        modal.show();
      }
    });
  }

  

  seleccionarMetodo(metodo: string) {
    this.metodoPago = metodo;
  }
  
  // FORMATEO Y VALIDACIONES DE TARJETA
    // ---------------------------------------------------

    formatearNumero() {
      let valor = this.formTarjeta.get('numero')?.value.replace(/\D/g, '');

      this.detectarTarjeta(valor);

      if (this.tipoTarjeta === 'AMEX') {
        valor = valor.slice(0, 15);
        valor = valor.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
      } else {
        valor = valor.slice(0, 16);
        valor = valor.replace(/(\d{4})/g, '$1 ').trim();
      }

      this.formTarjeta.get('numero')?.setValue(valor, { emitEvent: false });
    }

    detectarTarjeta(num: string) {
      if (/^4/.test(num)) {
        this.tipoTarjeta = 'VISA';
        this.iconoTarjeta = 'assets/visa.png';
        this.maxCVV = 3;
      }
      else if (/^5[1-5]/.test(num)) {
        this.tipoTarjeta = 'MASTERCARD';
        this.iconoTarjeta = 'assets/mastercard.jpg';
        this.maxCVV = 3;
      }
      else if (/^3[47]/.test(num)) {
        this.tipoTarjeta = 'AMEX';
        this.iconoTarjeta = 'assets/amex.png';
        this.maxCVV = 4;
      }
      else {
        this.tipoTarjeta = '';
        this.iconoTarjeta = '';
      }
    }

    formatearExpiracion() {
      let valor = this.formTarjeta.get('expiracion')?.value || '';
      valor = valor.replace(/\D/g, '').slice(0, 4);

      if (valor.length >= 3) valor = valor.slice(0, 2) + '/' + valor.slice(2);
      this.formTarjeta.get('expiracion')?.setValue(valor, { emitEvent: false });
    }

    luhn(numero: string) {
      let arr = numero.split('').reverse().map(n => +n);
      let sum = 0;

      arr.forEach((d, i) => {
        if (i % 2 === 1) d *= 2;
        if (d > 9) d -= 9;
        sum += d;
      });

      return sum % 10 === 0;
    }

    fechaValida(fecha: string): boolean {
      const [mes, año] = fecha.split('/').map(n => +n);
      if (!mes || !año) return false;
      if (mes < 1 || mes > 12) return false;

      const añoFull = 2000 + año;
      const hoy = new Date();
      const exp = new Date(añoFull, mes);

      return exp > hoy;
    }

    error(campo: string) {
      const c = this.formTarjeta.get(campo);
      return c?.invalid && c?.touched;
    }
	
	// CONFIRMAR PAGO
	confirmarPago() {
	  // VALIDAR TARJETA SI SE SELECCIONÓ TARJETA
	  if (this.metodoPago === 'tarjeta') {

	    const numero = this.formTarjeta.get('numero')?.value.replace(/\s+/g, '');
	    const expiracion = this.formTarjeta.get('expiracion')?.value;

	    if (!this.luhn(numero)) {
	      Swal.fire({
	        icon: "error",
	        title: "Número inválido",
	        text: "El número de tarjeta no pasó la validación Luhn.",
	        confirmButtonColor: "#8b4513"
	      });
	      return;
	    }

	    if (!this.fechaValida(expiracion)) {
	      Swal.fire({
	        icon: "error",
	        title: "Tarjeta expirada",
	        text: "La fecha de expiración no es válida.",
	        confirmButtonColor: "#8b4513"
	      });
	      return;
	    }

	    if (this.formTarjeta.invalid) {
	      this.formTarjeta.markAllAsTouched();
	      Swal.fire({
	        icon: "warning",
	        title: "Faltan datos",
	        text: "Completa todos los campos de la tarjeta.",
	        confirmButtonColor: "#8b4513"
	      });
	      return;
	    }
	  }

	  // MOSTRAR LOADING
	  Swal.fire({
	    title: "Procesando pago...",
	    text: "Por favor espera unos segundos.",
	    allowOutsideClick: false,
	    didOpen: () => {
	      Swal.showLoading();
	    }
	  });

	  // CREAR LA ORDEN
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

	  // ENVIAR AL BACKEND
	  this.http.post('http://localhost:8080/api/ordenes', orden).subscribe({
	    next: () => {
	      Swal.fire({
	        title: "Compra realizada con éxito",
	        text: "Gracias por tu compra. Tu pedido está en proceso.",
	        icon: "success",
	        confirmButtonColor: "#8b4513"
	      });

	      this.carritoService.limpiar();
	      this.router.navigate(['/mis-pedidos']);
	    },
	    error: () => {
	      Swal.fire({
	        title: "Error",
	        text: "Hubo un problema al registrar la compra.",
	        icon: "error",
	        confirmButtonColor: "#8b4513"
	      });
	    }
	  });
	}

  
}