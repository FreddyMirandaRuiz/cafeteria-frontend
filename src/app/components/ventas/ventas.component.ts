import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductoService, Producto } from '../../services/producto.service';
import { VentaService } from '../../services/venta.service';

declare var bootstrap: any;

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent implements OnInit {

  productos: Producto[] = [];
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

  // QR generado
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
      next: data => this.productos = data,
      error: err => console.error('❌ Error al cargar productos:', err)
    });
  }

  agregarProducto(producto: Producto) {
    const existente = this.detalles.find(d => d.producto.id === producto.id);
    if (existente) existente.cantidad++;
    else this.detalles.push({ producto, cantidad: 1 });
  }

  eliminarDetalle(index: number) {
    this.detalles.splice(index, 1);
  }

  calcularSubtotal(): number {
    return this.detalles.reduce((acc, d) => acc + d.producto.precio * d.cantidad, 0);
  }

  calcularIGV(): number {
    return this.calcularSubtotal() * 0.18;
  }

  calcularTotal(): number {
    return this.calcularSubtotal() + this.calcularIGV();
  }

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
    this.efectivo.cambio = 0;
    this.efectivo.montoRecibido = 0;

    const pagoEl = document.getElementById('modalPago');
    const pagoModal = new bootstrap.Modal(pagoEl);
    pagoModal.show();
  }

  seleccionarMetodo(m: 'tarjeta' | 'qr' | 'efectivo') {
    this.paymentMethod = m;
    if (m === 'efectivo') {
      this.efectivo.montoRecibido = 0;
      this.efectivo.cambio = 0;
    } else if (m === 'qr') {
      this.qr.metodo = 'yape';
      this.qr.referencia = '';
    }
  }
  
  /** ✅ Validaciones para tarjeta **/
    numeroTarjetaInvalido(): boolean {
		const soloNumeros = this.tarjeta.numero.replace(/\D/g, '');
		return soloNumeros.length > 0 && soloNumeros.length !== 16;
      
    }

    expTarjetaInvalido(): boolean {
      return !!(this.tarjeta.exp && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.tarjeta.exp));
    }

    cvvInvalido(): boolean {
      return !!(this.tarjeta.cvv && !/^[0-9]{3}$/.test(this.tarjeta.cvv));
    }
	
	// ✅ Validar formato y vigencia de fecha de expiración (MM/AA)
	validarExp(exp: string): boolean {
	  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) {
	    return false; // formato incorrecto
	  }

	  const [mesStr, anioStr] = exp.split('/');
	  const mes = parseInt(mesStr, 10);
	  const anio = parseInt('20' + anioStr, 10);

	  const hoy = new Date();
	  const mesActual = hoy.getMonth() + 1;
	  const anioActual = hoy.getFullYear();

	  // ❌ Si la fecha está vencida → inválido
	  if (anio < anioActual) return false;
	  if (anio === anioActual && mes < mesActual) return false;

	  return true;
	}
	
	formatearExpiracion() {
	  if (!this.tarjeta.exp) return;
	  
	  // Elimina cualquier carácter no numérico
	  this.tarjeta.exp = this.tarjeta.exp.replace(/\D/g, '');

	  // Inserta la barra después de los dos primeros dígitos (MM)
	  if (this.tarjeta.exp.length > 2) {
	    this.tarjeta.exp = this.tarjeta.exp.substring(0, 2) + '/' + this.tarjeta.exp.substring(2, 4);
	  }

	  // Limita el formato a MM/AA
	  if (this.tarjeta.exp.length > 5) {
	    this.tarjeta.exp = this.tarjeta.exp.substring(0, 5);
	  }
	}
	
	// 🚫 No permitir letras en expiración (MM/AA)
	soloNumerosExpiracion(event: KeyboardEvent) {
	  const tecla = event.key;

	  // Permitir números
	  if (/^\d$/.test(tecla)) return;

	  // Permitir borrar y moverse
	  if (
	    tecla === 'Backspace' ||
	    tecla === 'Delete' ||
	    tecla === 'Tab' ||
	    tecla === 'ArrowLeft' ||
	    tecla === 'ArrowRight'
	  ) return;

	  // Bloquear letras y símbolos
	  event.preventDefault();
	}
	
	validarMontoEfectivo(event: any) {
	  let valor = event.target.value;

	  // Permitir solo números y un punto
	  valor = valor.replace(/[^0-9.]/g, '');

	  // Evitar más de un punto
	  const partes = valor.split('.');
	  if (partes.length > 2) {
	    valor = partes[0] + '.' + partes[1];
	  }

	  // Evitar valores negativos
	  if (valor.startsWith('-')) {
	    valor = valor.replace('-', '');
	  }

	  // Limitar 2 decimales
	  if (partes.length === 2) {
	    partes[1] = partes[1].substring(0, 2);
	    valor = partes[0] + '.' + partes[1];
	  }

	  event.target.value = valor;
	  this.efectivo.montoRecibido = valor ? Number(valor) : 0;
	}
	
	
	
	
	// 🔹 Formatear número de tarjeta en grupos de 4 dígitos
	  formatearNumeroTarjeta() {
	    let valor = this.tarjeta.numero.replace(/\D/g, ''); // eliminar todo lo que no sea número
	    valor = valor.substring(0, 16); // limitar a 16 dígitos
	    this.tarjeta.numero = valor.replace(/(.{4})/g, '$1 ').trim().replace(/-$/, ''); // agrupar cada 4
	  }

	  // 🔹 Manejar pegado (paste) para evitar texto no numérico
	  formatearPegadoTarjeta(event: ClipboardEvent) {
		event.preventDefault();
	    const data = event.clipboardData?.getData('text') || '';
	    const soloNumeros = data.replace(/\D/g, '').substring(0, 16);
	    this.tarjeta.numero = soloNumeros.replace(/(.{4})/g, '$1-').trim().replace(/-$/, '');
	  }

	  // 🔹 Validar número sin guiones (solo 16 dígitos)
	  numeroTarjetaValido(): boolean {
	    const soloNumeros = this.tarjeta.numero.replace(/\D/g, '');
	    return /^[0-9]{16}$/.test(soloNumeros);
	  }
  
  puedeConfirmarPago(): boolean {
    if (!this.paymentMethod) return false;
	
	// 🔹 Validación para TARJETA
	  if (this.paymentMethod === 'tarjeta') {
		const numValido = this.numeroTarjetaValido();
	    //const numValido = /^[0-9]{16}$/.test(this.tarjeta.numero);
	    const nombreValido = this.tarjeta.nombre.trim().length > 0;
		const expValido = this.validarExp(this.tarjeta.exp); 
	    //const expValido = /^(0[1-9]|1[0-2])\/\d{2}$/.test(this.tarjeta.exp);
	    const cvvValido = /^[0-9]{3}$/.test(this.tarjeta.cvv);
	    return numValido && nombreValido && expValido && cvvValido;
	  }

	  // 🔹 Validación para QR
	  if (this.paymentMethod === 'qr') {
	    return !!this.qr.metodo && ['yape', 'plin'].includes(this.qr.metodo);
	  }

	  // 🔹 Validación para EFECTIVO
	  if (this.paymentMethod === 'efectivo') {
	    const total = this.calcularTotal();
	    const recibido = Number(this.efectivo.montoRecibido) || 0;
	    return recibido >= total; // debe cubrir el total
	  }

	  return false;
    
  }
  
  montoEfectivoInvalido(): boolean {
    const total = this.calcularTotal();
    const recibido = Number(this.efectivo.montoRecibido) || 0;

    return recibido > 0 && recibido < total;
  }
  

  calcularCambio() {
    const total = this.calcularTotal();
    const recibido = Number(this.efectivo.montoRecibido) || 0;
    this.efectivo.cambio = +(recibido - total);
  }
  
  // ✅ Validación del RUC para usar en HTML y TS
   esRucValido(): boolean {
     return /^[0-9]{11}$/.test(this.rucCliente || '');
  }
  
  soloNumeros(event: KeyboardEvent) {
    const tecla = event.key;

    // Permitir números, Backspace, Tab, flechas y Delete
    if (!/^\d$/.test(tecla) && tecla !== 'Backspace' && tecla !== 'Tab' 
        && tecla !== 'ArrowLeft' && tecla !== 'ArrowRight' && tecla !== 'Delete') {
      event.preventDefault();
    }
  }
  
  // Permitir solo números al escribir
  //soloNumeros(event: KeyboardEvent): void {
    //const charCode = event.key.charCodeAt(0);
    // Bloquea todo lo que no sea número (0–9)
    //if (charCode < 48 || charCode > 57) {
      //event.preventDefault();
    //}
  //}
  
  puedeRegistrarVenta(): boolean {
      const clienteValido = this.cliente.trim().length > 0;
      const productosValidos = this.detalles.length > 0;
      const rucValido =
        this.tipoComprobante === 'factura' ? this.esRucValido() : true;

      return clienteValido && productosValidos && rucValido;
    }

  confirmarPago() {
    const pagoEl = document.getElementById('modalPago');
    const pagoModal = bootstrap.Modal.getInstance(pagoEl);
    if (pagoModal) pagoModal.hide();

    const infoPago: any = { metodo: this.paymentMethod, detalles: {} };
    if (this.paymentMethod === 'tarjeta') infoPago.detalles = { ...this.tarjeta };
    else if (this.paymentMethod === 'qr') infoPago.detalles = { ...this.qr };
    else if (this.paymentMethod === 'efectivo') infoPago.detalles = { ...this.efectivo };

    this.registrarVenta(infoPago);
    this.resetPago();
  }

  resetPago() {
    this.paymentMethod = '';
    this.tarjeta = { numero: '', nombre: '', exp: '', cvv: '', cuotas: '1' };
    this.qr = { metodo: 'yape', referencia: '' };
    this.efectivo = { montoRecibido: 0, cambio: 0 };
  }

  registrarVenta(infoPago?: any) {
	if (!this.puedeRegistrarVenta()) {
	      alert('⚠️ Completa los datos del cliente y RUC (si es factura) antes de continuar.');
	      return;
	    }

    const venta: any = {
      cliente: this.cliente,
      tipoComprobante: this.tipoComprobante,
      numeroComprobante: this.numeroComprobante,
      ruc: this.tipoComprobante === 'factura' ? this.rucCliente : undefined,
      detalles: this.detalles.map(d => ({ producto: d.producto, cantidad: d.cantidad })),
      subtotal: this.calcularSubtotal(),
      igv: this.calcularIGV(),
      total: this.calcularTotal(),
      pago: infoPago
    };
	
	// ✅ Enviar al backend

    this.ventaService.registrar(venta).subscribe({
      next: (res: any) => {
        const ventaGuardada = res.venta ? res.venta : res;
        const qrBase64 = res.qrBase64 || null;

        // 🔹 Capturamos número generado desde backend
        this.numeroComprobante = ventaGuardada.numeroComprobante;
        this.qrBase64 = qrBase64;

        alert(`${ventaGuardada.tipoComprobante.toUpperCase()} generada ✅`);
        this.generarPDF(ventaGuardada, qrBase64);
        this.limpiarFormulario();
      },
      error: err => {
        console.error('❌ Error al registrar venta:', err);
        alert('Error al registrar la venta ❌');
      }
    });
  }

  generarPDF(venta: any, qrBase64?: string) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('CAFETERÍA DELICIAS PERUANAS S.A.C', 20, 20);
    doc.setFontSize(12);
    doc.text('RUC: 20123456789', 20, 28);
    doc.text('Dirección: Av. Los Olivos 123 - Lima', 20, 34);
    doc.text('Teléfono: (+51) 997-648-811', 20, 40);
    doc.line(20, 45, 190, 45);

    doc.setFontSize(14);
    doc.text('COMPROBANTE DE PAGO', 20, 55);
    doc.setFontSize(12);
    doc.text(`Tipo: ${(venta.tipoComprobante || '').toUpperCase()}`, 20, 65);
    doc.text(`Número: ${venta.numeroComprobante || '---'}`, 20, 72);
    doc.text(`Cliente: ${venta.cliente || '---'}`, 20, 79);
    if (venta.tipoComprobante === 'factura' && venta.ruc)
      doc.text(`RUC Cliente: ${venta.ruc}`, 20, 86);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 20, 93);

    const filas = (venta.detalles ?? []).map((d: any) => [
      d.producto?.nombre ?? 'Producto',
      d.cantidad ?? 0,
      `S/ ${(d.producto?.precio ?? 0).toFixed(2)}`,
      `S/ ${((d.producto?.precio ?? 0) * (d.cantidad ?? 0)).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 105,
      head: [['Producto', 'Cantidad', 'Precio', 'Subtotal']],
      body: filas,
      theme: 'grid'
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 110;
    doc.text(`Subtotal: S/ ${(venta.subtotal ?? this.calcularSubtotal()).toFixed(2)}`, 140, finalY + 10);
    doc.text(`IGV (18%): S/ ${(venta.igv ?? this.calcularIGV()).toFixed(2)}`, 140, finalY + 20);
    doc.text(`Total: S/ ${(venta.total ?? this.calcularTotal()).toFixed(2)}`, 140, finalY + 30);

    // QR en PDF (si existe)
    if (qrBase64) {
      doc.addImage(qrBase64, 'PNG', 20, finalY + 40, 40, 40);
    }

    doc.save(`${venta.tipoComprobante}_${venta.numeroComprobante || 'sin-numero'}.pdf`);
  }

  limpiarFormulario() {
    this.detalles = [];
    this.cliente = '';
    this.rucCliente = '';
    this.numeroComprobante = '';
    this.tipoComprobante = 'boleta';
    this.qrBase64 = null;
    this.resetPago();
  }
}