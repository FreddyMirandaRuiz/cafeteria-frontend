import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthClienteService } from '../../services/auth-cliente.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mis-pedidos.component.html',
  styleUrls: ['./mis-pedidos.component.css']
})
export class MisPedidosComponent implements OnInit {
  pedidos: any[] = [];
  pedidosFiltrados: any[] = [];
  nombreCliente: string = '';

  // Filtros
  busqueda: string = '';
  filtroFecha: string = '';
  filtroMonto: string = '';
  orden: string = 'recientes';
  filtroEstado: string = '';
  fechaDesde: string = '';
  fechaHasta: string = '';

  constructor(private http: HttpClient, private authCliente: AuthClienteService) {}

  ngOnInit(): void {
    this.nombreCliente = this.authCliente.obtenerNombre() || '';
    if (this.nombreCliente) {
      this.http.get<any[]>(`http://localhost:8080/api/ordenes?cliente=${this.nombreCliente}`).subscribe({
        next: (data) => {

          this.pedidos = data.map((p, i) => ({
            ...p,
            // Convertimos la fecha a LOCAL evitando UTC
            fechaLocal: new Date(p.fecha + 'T00:00:00'),
            estado: this.calcularEstado(p.fecha),
            delay: i * 120
          }));

          this.pedidosFiltrados = [...this.pedidos];
        },
        error: (err) => console.error('❌ Error al obtener pedidos', err)
      });
    }
  }

  // Para mostrar correctamente el estado
  calcularEstado(fecha: string) {
    const fechaLocal = new Date(fecha + 'T00:00:00');
    const dias = (Date.now() - fechaLocal.getTime()) / (1000 * 60 * 60 * 24);

    if (dias <= 1) return 'Procesando';
    if (dias <= 3) return 'En camino';
    return 'Entregado';
  }

  aplicarFiltros() {
    let lista = [...this.pedidos];

    // ---- BUSCADOR ----
    if (this.busqueda.trim() !== '') {
      lista = lista.filter(p =>
        p.detalles.some((d: any) =>
          d.nombreProducto.toLowerCase().includes(this.busqueda.toLowerCase())
        )
      );
    }

    // ---- FILTRO FECHA: HOY ----
    if (this.filtroFecha === 'hoy') {
		const hoy = new Date();
		  hoy.setHours(0, 0, 0, 0);

		  lista = lista.filter(p => {

		    // Convertir la fecha "2025-12-01" sin UTC
		    const partes = p.fecha.split('-');
		    const fechaPedido = new Date(
		      Number(partes[0]),
		      Number(partes[1]) - 1,  // MES
		      Number(partes[2])       // DÍA
		    );
		    fechaPedido.setHours(0, 0, 0, 0);

		    return fechaPedido.getTime() === hoy.getTime();
		  });	
    }
	
	// ---- FILTRO FECHA: AYER ----
	if (this.filtroFecha === 'ayer') {
	  const hoy = new Date();
	  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);

	  lista = lista.filter(p => {
	    const f = new Date(
	      Number(p.fecha.substring(0, 4)),
	      Number(p.fecha.substring(5, 7)) - 1,
	      Number(p.fecha.substring(8, 10))
	    );
	    return f.getTime() === ayer.getTime();
	  });
	}

    // ---- FILTRO FECHA: SEMANA ----
    if (this.filtroFecha === 'semana') {
      lista = lista.filter(p => {
        const fechaPedido = new Date(p.fecha + 'T00:00:00').getTime();
        const dias = (Date.now() - fechaPedido) / (1000 * 60 * 60 * 24);
        return dias <= 7;
      });
    }
	
	// ---- FILTRO FECHA: ESTE MES ----
	if (this.filtroFecha === 'mes') {
	  const hoy = new Date();
	  const mesActual = hoy.getMonth();
	  const añoActual = hoy.getFullYear();

	  lista = lista.filter(p => {
	    const f = new Date(
	      Number(p.fecha.substring(0, 4)),
	      Number(p.fecha.substring(5, 7)) - 1,
	      Number(p.fecha.substring(8, 10))
	    );
	    return f.getFullYear() === añoActual && f.getMonth() === mesActual;
	  });
	}
	
	// filtro por año
	if (this.filtroFecha === 'anio') {
	  const hoy = new Date();
	  const añoActual = hoy.getFullYear();

	  lista = lista.filter(p => {
	    const f = new Date(p.fecha + 'T00:00:00');
	    return f.getFullYear() === añoActual;
	  });
	}
	
	//filtro de rango de fechas
	if (this.filtroFecha === 'rango' && this.fechaDesde && this.fechaHasta) {
	  const desde = new Date(this.fechaDesde);
	  const hasta = new Date(this.fechaHasta);
	  hasta.setHours(23, 59, 59, 999);

	  lista = lista.filter(p => {
	    const f = new Date(p.fecha + 'T00:00:00');
	    return f >= desde && f <= hasta;
	  });
	}
	
	//filtro estado del pedido
	if (this.filtroEstado !== '') {
	  lista = lista.filter(p => p.estado === this.filtroEstado);
	}

    // ---- MONTOS ----
    if (this.filtroMonto === 'bajo') lista = lista.filter(p => p.total < 20);
    if (this.filtroMonto === 'medio') lista = lista.filter(p => p.total >= 20 && p.total <= 50);
    if (this.filtroMonto === 'alto') lista = lista.filter(p => p.total > 50);

    // ---- ORDEN ----
    lista.sort((a, b) =>
      this.orden === 'recientes'
        ? new Date(b.fecha + 'T00:00:00').getTime() - new Date(a.fecha + 'T00:00:00').getTime()
        : new Date(a.fecha + 'T00:00:00').getTime() - new Date(b.fecha + 'T00:00:00').getTime()
    );

    this.pedidosFiltrados = lista;
  }

  // --------------------------------------------
  //         PDF + CORRECCIÓN DE FECHA
  // --------------------------------------------
  generarPDF(pedido: any) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('CAFETERÍA DELICIAS PERUANAS S.A.C', 20, 20);
    doc.setFontSize(12);
    doc.text('RUC: 20123456789', 20, 28);
    doc.text('Dirección: Av. Los Olivos 123 - Lima', 20, 34);
    doc.text('Teléfono: (+51) 997-648-811', 20, 40);

    doc.line(20, 45, 190, 45);

    doc.setFontSize(14);
    doc.text('COMPROBANTE DE COMPRA', 20, 55);

    const fechaLocal = new Date(pedido.fecha + 'T00:00:00')
      .toLocaleDateString('es-PE');

    doc.setFontSize(12);
    doc.text(`Cliente: ${pedido.cliente}`, 20, 65);
    doc.text(`Fecha: ${fechaLocal}`, 20, 72);
    doc.text(`Número de orden: #${pedido.id}`, 20, 79);
    doc.text(`Método de pago: ${pedido.metodoPago || 'No especificado'}`, 20, 86);
    doc.text(`Estado: ${pedido.estado}`, 20, 93);

    const filas = pedido.detalles.map((d: any) => [
      d.nombreProducto,
      d.cantidad,
      `S/ ${d.precio.toFixed(2)}`,
      `S/ ${(d.precio * d.cantidad).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 110,
      head: [['Producto', 'Cantidad', 'Precio', 'Subtotal']],
      body: filas
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total: S/ ${pedido.total.toFixed(2)}`, 140, finalY);

    doc.save(`Comprobante_${pedido.cliente}_${pedido.id}.pdf`);

    Swal.fire({
      title: '📄 Comprobante generado',
      text: 'Tu comprobante ha sido descargado correctamente.',
      icon: 'success',
      confirmButtonColor: '#0d6efd'
    });
  }

  // --------------------------------------------
  //     ENVIAR PDF POR CORREO (SIN CAMBIOS)
  // --------------------------------------------

  async enviarComprobante(pedido: any) {
    const { value: email } = await Swal.fire({
      title: 'Enviar comprobante',
      input: 'email',
      inputLabel: 'Ingresa el correo donde recibirás el comprobante',
      inputPlaceholder: 'tucorreo@gmail.com',
      confirmButtonColor: '#0d6efd',
      confirmButtonText: 'Enviar',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return '⚠ Debes ingresar un correo válido';
        }
        return null;
      }
    });

    if (email) {
      Swal.fire({
        title: '📧 Comprobante enviado',
        text: `El comprobante se envió a: ${email}`,
        icon: 'success',
        confirmButtonColor: '#0d6efd'
      });
    }
  }
}