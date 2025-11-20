import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthClienteService } from '../../services/auth-cliente.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-pedidos.component.html',
  styleUrls: ['./mis-pedidos.component.css']
})
export class MisPedidosComponent implements OnInit {
  pedidos: any[] = [];
  nombreCliente: string = '';

  constructor(private http: HttpClient, private authCliente: AuthClienteService) {}

  ngOnInit(): void {
    this.nombreCliente = this.authCliente.obtenerNombre() || '';
    if (this.nombreCliente) {
      this.http.get<any[]>(`http://localhost:8080/api/ordenes?cliente=${this.nombreCliente}`).subscribe({
        next: (data) => this.pedidos = data,
        error: (err) => console.error('❌ Error al obtener pedidos', err)
      });
    }
  }

  generarPDF(pedido: any) {
    const doc = new jsPDF();

    // 🧾 Encabezado
    doc.setFontSize(18);
    doc.text('CAFETERÍA DELICIAS PERUANAS S.A.C', 20, 20);
    doc.setFontSize(12);
    doc.text('RUC: 20123456789', 20, 28);
    doc.text('Dirección: Av. Los Olivos 123 - Lima', 20, 34);
    doc.text('Teléfono: (+51) 997-648-811', 20, 40);
	

    // Línea separadora
    doc.line(20, 45, 190, 45);

    // 🧍 Datos del cliente
    doc.setFontSize(14);
    doc.text('COMPROBANTE DE COMPRA', 20, 55);
    doc.setFontSize(12);
    doc.text(`Cliente: ${pedido.cliente}`, 20, 65);
    doc.text(`Fecha: ${new Date(pedido.fecha).toLocaleDateString()}`, 20, 72);
    doc.text(`Número de orden: #${pedido.id}`, 20, 79);
	doc.text(`Método de pago: ${pedido.metodoPago || 'No especificado'}`, 20, 86);

    // 🛒 Detalles de la compra
    const filas = pedido.detalles.map((d: any) => [
      d.nombreProducto,
      d.cantidad,
      `S/ ${d.precio.toFixed(2)}`,
      `S/ ${(d.precio * d.cantidad).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 100,
      head: [['Producto', 'Cantidad', 'Precio', 'Subtotal']],
      body: filas
    });

    // Totales
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total: S/ ${pedido.total.toFixed(2)}`, 140, finalY);

    // Guardar PDF
    doc.save(`Comprobante_${pedido.cliente}_${pedido.id}.pdf`);
	Swal.fire({
	  title: '📄 Comprobante generado',
	  text: 'Tu comprobante ha sido descargado correctamente.',
	  icon: 'success',
	  confirmButtonColor: '#0d6efd',
	  confirmButtonText: 'Aceptar'
	});
  }
}