import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { VentaService, Venta, DetalleVenta } from '../../services/venta.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare var bootstrap: any;

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit {

  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
  busqueda: string = '';
  ventaSeleccionada: Venta | null = null;

  constructor(private ventaService: VentaService) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial() {
    this.ventaService.listar().subscribe({
      next: (data) => {
        this.ventas = data || [];
        this.ventasFiltradas = this.ventas;
        console.log('✅ Ventas cargadas:', data);
      },
      error: (err) => console.error('❌ Error al listar ventas:', err)
    });
  }

  calcularSubtotal(det: DetalleVenta): number {
    if (!det || !det.producto) return 0;
    return det.subtotal ?? (det.producto.precio * det.cantidad);
  }

  filtrarVentas() {
    const termino = this.busqueda.toLowerCase();
    this.ventasFiltradas = this.ventas.filter(v =>
      (v.cliente?.toLowerCase().includes(termino)) ||
      (v.fecha && new Date(v.fecha).toLocaleDateString().includes(termino))
    );
  }

  abrirDetalles(venta: Venta) {
    this.ventaSeleccionada = venta;
    const modal = new bootstrap.Modal(document.getElementById('modalDetallesVenta'));
    modal.show();
  }

  generarPDF() {
    if (!this.ventaSeleccionada) return;

    const venta = this.ventaSeleccionada;
    const fecha = venta.fecha ? new Date(venta.fecha).toLocaleString() : 'Sin fecha';
    const total = venta.total ?? 0;

    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(16);
    doc.text('☕ Cafetería Delicias Peruanas S.A.C', 20, 20);
    doc.setFontSize(11);
    doc.text('RUC: 20658974562', 20, 28);
    doc.text('Teléfono: 997648811', 20, 34);
    doc.text('Dirección: Lima - Perú', 20, 40);
    doc.text('---------------------------------------------', 20, 45);

    // Datos de la venta
    doc.setFontSize(13);
    doc.text('Comprobante de Venta', 70, 55);
    doc.setFontSize(11);
    doc.text(`Cliente: ${venta.cliente ?? 'Desconocido'}`, 20, 65);
    doc.text(`Fecha: ${fecha}`, 20, 72);
    doc.text(`Total: S/ ${total.toFixed(2)}`, 20, 79);

    // Verifica que haya detalles
    const detalles = venta.detalles ?? [];
    const productos = detalles.map((d: any) => [
      d.producto?.nombre ?? 'Sin nombre',
      d.cantidad ?? 0,
      `S/ ${(d.producto?.precio ?? 0).toFixed(2)}`,
      `S/ ${((d.producto?.precio ?? 0) * (d.cantidad ?? 0)).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Producto', 'Cant.', 'Precio', 'Subtotal']],
      body: productos.length > 0 ? productos : [['(sin datos)', '', '', '']],
    });

    // Posición segura del texto final
    const lastY = (doc as any).lastAutoTable?.finalY ?? 110;

    doc.text('---------------------------------------------', 20, lastY + 10);
    doc.text('Gracias por su compra ☕', 70, lastY + 18);
    doc.text('Cafetería Delicias Peruanas', 65, lastY + 24);

    doc.save(`Comprobante_${venta.cliente ?? 'cliente'}.pdf`);
  }
}