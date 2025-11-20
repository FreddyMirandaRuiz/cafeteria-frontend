import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { PedidoService, Pedido } from '../../services/pedido.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare var bootstrap: any;

@Component({
  selector: 'app-historial-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './historial-pedidos.component.html',
  styleUrls: ['./historial-pedidos.component.css']
})
export class HistorialPedidosComponent implements OnInit {
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  pedidoSeleccionado: Pedido | null = null;
  busqueda: string = '';

  constructor(private pedidoService: PedidoService) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  // 🔹 Cargar pedidos desde el backend
  cargarPedidos(): void {
    this.pedidoService.obtenerPedidos().subscribe({
      next: (data) => {
        this.pedidos = data || [];
        this.pedidosFiltrados = this.pedidos;
        console.log('✅ Pedidos cargados:', data);
      },
      error: (err) => console.error('❌ Error al cargar pedidos', err)
    });
  }

  // 🔹 Filtrar por mesa, mozo, estado o fecha
  filtrarPedidos(): void {
    const termino = this.busqueda.toLowerCase();
    this.pedidosFiltrados = this.pedidos.filter(p =>
      p.mesa?.toLowerCase().includes(termino) ||
      p.mozo?.toLowerCase().includes(termino) ||
      p.estado?.toLowerCase().includes(termino) ||
      (p.fecha && new Date(p.fecha).toLocaleDateString().includes(termino))
    );
  }

  // 🔹 Abrir modal
  abrirModal(pedido: Pedido): void {
    this.pedidoSeleccionado = pedido;
    const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
    modal.show();
  }

  // 🔹 Obtener detalles seguros (sin errores)
  getDetallesSeguro(): any[] {
    if (!this.pedidoSeleccionado || !this.pedidoSeleccionado.detalles) {
      return [];
    }

    return this.pedidoSeleccionado.detalles.map((d: any) => ({
      nombre: d?.nombreProducto || d?.producto?.nombre || 'Sin nombre',
      cantidad: d?.cantidad || 0,
      precio: d?.precio || d?.producto?.precio || 0,
      subtotal:
        d?.subtotal ||
        ((d?.precio || d?.producto?.precio || 0) * (d?.cantidad || 0)),
    }));
  }

  // 🔹 Generar comprobante PDF
  generarPDF(): void {
    if (!this.pedidoSeleccionado) return;

    const pedido = this.pedidoSeleccionado;
    const fecha = pedido.fecha ? new Date(pedido.fecha).toLocaleString() : 'Sin fecha';
    const total = pedido.total || 0;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('☕ Cafetería Delicias Peruanas S.A.C', 20, 20);
    doc.setFontSize(11);
    doc.text('RUC: 20658974562', 20, 28);
    doc.text('Teléfono: 997648811', 20, 34);
    doc.text('Dirección: Lima - Perú', 20, 40);
    doc.text('---------------------------------------------', 20, 45);

    doc.setFontSize(13);
    doc.text('Comprobante de Pedido', 70, 55);
    doc.setFontSize(11);
    doc.text(`Mesa: ${pedido.mesa}`, 20, 65);
    doc.text(`Mozo: ${pedido.mozo}`, 20, 72);
    doc.text(`Fecha: ${fecha}`, 20, 79);
    doc.text(`Estado: ${pedido.estado}`, 20, 86);
    doc.text(`Total: S/ ${total.toFixed(2)}`, 20, 93);

    const filas = this.getDetallesSeguro().map(d => [
      d.nombre,
      d.cantidad,
      `S/ ${d.precio.toFixed(2)}`,
      `S/ ${d.subtotal.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 105,
      head: [['Producto', 'Cantidad', 'Precio', 'Subtotal']],
      body: filas.length > 0 ? filas : [['(sin datos)', '', '', '']],
    });

    const lastY = (doc as any).lastAutoTable?.finalY ?? 110;
    doc.text('---------------------------------------------', 20, lastY + 10);
    doc.text('Gracias por su compra ☕', 70, lastY + 18);
    doc.text('Cafetería Delicias Peruanas', 65, lastY + 24);
    doc.save(`Comprobante_Mesa_${pedido.mesa ?? 'pedido'}.pdf`);
  }
}