import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductoService, Producto } from '../../services/producto.service';
import { VentaService, Venta, VentaResponse } from '../../services/venta.service';

declare var bootstrap: any;

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent implements OnInit {

  // Listado y Búsqueda
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  filtroProducto: string = '';

  // Carrito y Datos de Venta
  detalles: { producto: Producto, cantidad: number }[] = [];
  cliente: string = '';
  rucCliente: string = '';
  numeroComprobante: string = '';
  tipoComprobante: 'boleta' | 'factura' = 'boleta';

  // Pago
  paymentMethod: 'tarjeta' | 'qr' | 'efectivo' | '' = '';
  tarjeta = { numero: '', nombre: '', exp: '', cvv: '', cuotas: '1' };
  qr = { metodo: 'yape', referencia: '' };
  efectivo = { montoRecibido: 0, cambio: 0 };

  // QR generado por el Backend
  qrBase64: string | null = null;

  constructor(
    private productoService: ProductoService,
    private ventaService: VentaService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos() {
    this.productoService.listar().subscribe({
      next: data => {
        this.productos = data;
        this.productosFiltrados = data;
      },
      error: err => console.error('❌ Error al cargar productos:', err)
    });
  }

  buscarProducto() {
    this.productosFiltrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(this.filtroProducto.toLowerCase())
    );
  }

  agregarProducto(producto: Producto) {
	
	if (this.detalles.length === 0) {
	    this.qrBase64 = null; 
	  }
    const existente = this.detalles.find(d => d.producto.id === producto.id);
    if (existente) {
      if (existente.cantidad >= producto.stock) {
        alert(`⚠️ No hay más stock disponible de ${producto.nombre}`);
        return;
      }
      existente.cantidad++;
    } else {
      if (producto.stock <= 0) {
        alert(`❌ El producto ${producto.nombre} está agotado.`);
        return;
      }
      this.detalles.push({ producto, cantidad: 1 });
    }
  }

  eliminarDetalle(index: number) {
    this.detalles.splice(index, 1);
  }

  // --- Cálculos ---
  calcularSubtotal(): number {
    return this.detalles.reduce((acc, d) => acc + d.producto.precio * d.cantidad, 0);
  }

  calcularIGV(): number {
    return this.calcularSubtotal() * 0.18;
  }

  calcularTotal(): number {
    return this.calcularSubtotal() + this.calcularIGV();
  }

  // --- Validaciones de Interfaz (Requeridas por tu HTML) ---
  
  soloNumeros(event: KeyboardEvent) {
    const tecla = event.key;
    const permitir = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
    if (!/^\d$/.test(tecla) && !permitir.includes(tecla)) {
      event.preventDefault();
    }
  }

  soloNumerosExpiracion(event: KeyboardEvent) {
    this.soloNumeros(event);
  }

  esRucValido(): boolean {
    return /^[0-9]{11}$/.test(this.rucCliente || '');
  }

  // --- Lógica de Efectivo (Requerida por tu HTML) ---
  
  validarMontoEfectivo(event: any) {
    let valor = event.target.value;
    valor = valor.replace(/[^0-9.]/g, '');
    const partes = valor.split('.');
    if (partes.length > 2) valor = partes[0] + '.' + partes[1];
    if (partes.length === 2) {
      partes[1] = partes[1].substring(0, 2);
      valor = partes[0] + '.' + partes[1];
    }
    event.target.value = valor;
    this.efectivo.montoRecibido = valor ? Number(valor) : 0;
  }

  montoEfectivoInvalido(): boolean {
    const total = this.calcularTotal();
    const recibido = Number(this.efectivo.montoRecibido) || 0;
    return recibido > 0 && recibido < total;
  }

  calcularCambio() {
    const total = this.calcularTotal();
    const recibido = Number(this.efectivo.montoRecibido) || 0;
    this.efectivo.cambio = Math.max(0, recibido - total);
  }

  // --- Gestión de Tarjeta ---
  
  formatearExpiracion() {
    this.tarjeta.exp = this.tarjeta.exp.replace(/\D/g, '');
    if (this.tarjeta.exp.length > 2) {
      this.tarjeta.exp = this.tarjeta.exp.substring(0, 2) + '/' + this.tarjeta.exp.substring(2, 4);
    }
  }

  formatearNumeroTarjeta() {
    let valor = this.tarjeta.numero.replace(/\D/g, '').substring(0, 16);
    this.tarjeta.numero = valor.replace(/(.{4})/g, '$1 ').trim();
  }

  formatearPegadoTarjeta(event: ClipboardEvent) {
    event.preventDefault();
    const data = event.clipboardData?.getData('text') || '';
    this.tarjeta.numero = data.replace(/\D/g, '').substring(0, 16);
    this.formatearNumeroTarjeta();
  }

  numeroTarjetaValido(): boolean {
    return this.tarjeta.numero.replace(/\D/g, '').length === 16;
  }

  expTarjetaInvalido(): boolean {
    return !!(this.tarjeta.exp && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.tarjeta.exp));
  }

  cvvInvalido(): boolean {
    return !!(this.tarjeta.cvv && !/^[0-9]{3}$/.test(this.tarjeta.cvv));
  }

  validarExp(exp: string): boolean {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return false;
    const [mes, anio] = exp.split('/').map(v => parseInt(v, 10));
    const hoy = new Date();
    const anioActual = parseInt(hoy.getFullYear().toString().substring(2), 10);
    if (anio < anioActual) return false;
    if (anio === anioActual && mes < (hoy.getMonth() + 1)) return false;
    return true;
  }

  // --- Modales ---
  
  abrirConfirmacion() {
    const modalEl = document.getElementById('modalConfirmarVenta');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  abrirModalPago() {
    const confirmEl = document.getElementById('modalConfirmarVenta');
    const confirmModal = bootstrap.Modal.getInstance(confirmEl);
    if (confirmModal) confirmModal.hide();

    if (!this.paymentMethod) this.paymentMethod = 'efectivo';
    const pagoEl = document.getElementById('modalPago');
    const pagoModal = new bootstrap.Modal(pagoEl);
    pagoModal.show();
  }

  seleccionarMetodo(m: 'tarjeta' | 'qr' | 'efectivo') {
    this.paymentMethod = m;
    this.resetDatosPago();
  }

  // --- Lógica de Negocio ---
  
  puedeConfirmarPago(): boolean {
    if (this.paymentMethod === 'tarjeta') {
      return this.numeroTarjetaValido() && this.tarjeta.nombre.length > 2 && 
             this.validarExp(this.tarjeta.exp) && !this.cvvInvalido() && this.tarjeta.cvv.length === 3;
    }
    if (this.paymentMethod === 'qr') return !!this.qr.metodo;
    if (this.paymentMethod === 'efectivo') return !this.montoEfectivoInvalido() && this.efectivo.montoRecibido > 0;
    return false;
  }

  puedeRegistrarVenta(): boolean {
    const rucOk = this.tipoComprobante === 'factura' ? this.esRucValido() : true;
    return this.cliente.trim().length > 0 && this.detalles.length > 0 && rucOk;
  }

  confirmarPago() {
    const pagoEl = document.getElementById('modalPago');
    const pagoModal = bootstrap.Modal.getInstance(pagoEl);
    if (pagoModal) pagoModal.hide();

    const infoPago = {
      metodo: this.paymentMethod,
      detalles: this.paymentMethod === 'tarjeta' ? this.tarjeta : 
                this.paymentMethod === 'qr' ? this.qr : this.efectivo
    };

    this.enviarVentaAlBackend(infoPago);
  }

  enviarVentaAlBackend(infoPago: any) {
	this.qrBase64 = null;
    const venta: any = {
      cliente: this.cliente,
      tipoComprobante: this.tipoComprobante,
      ruc: this.tipoComprobante === 'factura' ? this.rucCliente : undefined,
      detalles: this.detalles.map(d => ({ 
        producto: { id: d.producto.id }, 
        cantidad: d.cantidad 
      })),
      subtotal: this.calcularSubtotal(),
      igv: this.calcularIGV(),
      total: this.calcularTotal()
    };

    this.ventaService.registrar(venta).subscribe({
      next: (res: VentaResponse) => {
        this.qrBase64 = res.qrBase64;
        this.actualizarStockLocal();
        alert(`✅ Venta registrada: ${res.venta.numeroComprobante}`);
        this.generarPDF(res.venta, res.qrBase64);
        this.limpiarFormulario();
      },
      error: err => {
        const msg = err.error?.message || 'Error al registrar la venta';
        alert('❌ ' + msg);
      }
    });
  }

  actualizarStockLocal() {
    this.detalles.forEach(d => {
      const prod = this.productos.find(p => p.id === d.producto.id);
      if (prod) prod.stock -= d.cantidad;
    });
    this.buscarProducto();
  }
  
  generarPDF(venta: any, qrBase64?: string) {
    try {
      const doc = new jsPDF();

      // 1. Encabezado de la Empresa (Estilo antiguo)
      doc.setFontSize(18);
      doc.setTextColor(107, 79, 41); // Color café
      doc.text('CAFETERÍA DELICIAS PERUANAS S.A.C', 20, 20);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('RUC: 20123456789', 20, 28);
      doc.text('Dirección: Av. Los Olivos 123 - Lima', 20, 34);
      doc.text('Teléfono: (+51) 997-648-811', 20, 40);
      doc.line(20, 45, 190, 45); // Línea divisoria

      // 2. Información del Comprobante (Coordenadas ajustadas para no solapar)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPROBANTE DE PAGO', 20, 55);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tipo: ${(venta.tipoComprobante || 'Boleta').toUpperCase()}`, 20, 65);
      doc.text(`Número: ${venta.numeroComprobante || '---'}`, 20, 72);
      doc.text(`Cliente: ${venta.cliente || '---'}`, 20, 79);
      
      if (venta.tipoComprobante === 'factura' && venta.rucCliente) {
        doc.text(`RUC Cliente: ${venta.rucCliente}`, 20, 86);
      }
      doc.text(`Fecha: ${new Date().toLocaleString()}`, 20, 93);

      // 3. Mapeo de Productos (SOPORTA AMBAS ESTRUCTURAS)
      const filas = (venta.detalles || []).map((d: any) => {
        
		const nombre = d.nombreProducto || d.descripcion || d.producto?.nombre || 'Producto';
        
        const precio = d.precioUnitario || d.precio || d.producto?.precio || 0;
        
        const cant = d.cantidad || 0;
        const subt = d.subtotal || (cant * precio);
        
        return [
          nombre,
          cant,
          `S/ ${Number(precio).toFixed(2)}`,
          `S/ ${Number(subt).toFixed(2)}`
        ];
      });

      // 4. Generación de Tabla
      autoTable(doc, {
        startY: 100,
        head: [['Producto', 'Cant.', 'Precio', 'Subtotal']],
        body: filas,
        theme: 'grid',
        headStyles: { fillColor: [107, 79, 41] }, // Café temático
        styles: { fontSize: 10 }
      });

      // 5. Totales (Posicionados después de la tabla)
      const finalY = (doc as any).lastAutoTable?.finalY || 110;
      doc.setFont('helvetica', 'bold');
	  
	  // Si venta.subtotal no existe, usamos this.calcularSubtotal()
	  const subtotalPDF = venta.subtotal || this.calcularSubtotal();
	  const igvPDF = venta.igv || (subtotalPDF * 0.18);
	  const totalPDF = venta.total || (subtotalPDF + igvPDF);
	  
      doc.text(`Subtotal: S/ ${Number(venta.subtotal || 0).toFixed(2)}`, 140, finalY + 10);
      doc.text(`IGV (18%): S/ ${Number(venta.igv || 0).toFixed(2)}`, 140, finalY + 18);
      doc.text(`Total: S/ ${Number(venta.total || 0).toFixed(2)}`, 140, finalY + 26);

      // 6. QR (Si existe)
      if (qrBase64) {
        const imgData = qrBase64.startsWith('data:image') ? qrBase64 : `data:image/png;base64,${qrBase64}`;
        doc.addImage(imgData, 'PNG', 20, finalY + 10, 35, 35);
      }

      // 7. Guardar
      doc.save(`${venta.tipoComprobante || 'Ticket'}_${venta.numeroComprobante || '001'}.pdf`);

    } catch (error) {
      console.error('Error detallado en PDF:', error);
      alert('⚠️ Error al generar el PDF. Revise la estructura de datos.');
    }
  }

 

  limpiarFormulario() {
    this.detalles = [];
    this.cliente = '';
    this.rucCliente = '';
    this.qrBase64 = null;
    this.paymentMethod = '';
    this.resetDatosPago();
  }

  resetDatosPago() {
    this.tarjeta = { numero: '', nombre: '', exp: '', cvv: '', cuotas: '1' };
    this.qr = { metodo: 'yape', referencia: '' };
    this.efectivo = { montoRecibido: 0, cambio: 0 };
  }
}