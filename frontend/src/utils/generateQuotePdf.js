import { formatPrice } from './format';

// Datos de la empresa ficticia usados en el encabezado del PDF. Son datos de
// demostración (dirección y cuenta bancaria de ejemplo), no corresponden a
// una empresa real.
const COMPANY = {
  name: 'FERRETERÍA GARACHENA',
  legalName: 'J. Garachena S.A.',
  rut: '76.890.123-4',
  addresses: ['Av. Providencia 1234, Providencia', 'Av. Vitacura 5678, Vitacura'],
};

const NAVY = [11, 31, 63];
const SLATE_500 = [100, 116, 139];
const SLATE_200 = [226, 232, 240];

function buildQuoteNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(100 + Math.random() * 900);
  return `COT-${y}${m}${d}-${rand}`;
}

/**
 * Genera y descarga una cotización B2B en PDF a partir de los ítems del
 * carrito. `customer` (nombre/rut/email) es completamente opcional: si no se
 * completa, el PDF igual se genera mostrando "No especificado".
 *
 * jsPDF + jspdf-autotable (y sus dependencias opcionales, html2canvas y
 * DOMPurify) pesan ~380 kB minificados; se importan dinámicamente para que
 * ese peso no vaya en el bundle principal de la tienda y solo se descargue
 * cuando alguien realmente abre el generador de cotizaciones.
 */
export async function generateB2BQuotePdf({ items, customer = {} }) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const quoteNumber = buildQuoteNumber();
  const dateStr = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

  // --- Encabezado ---
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.8);
  doc.circle(margin + 6, 15, 6, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('G', margin + 6, 17.3, { align: 'center' });

  doc.setFontSize(14);
  doc.text(COMPANY.name, margin + 16, 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${COMPANY.legalName} · RUT ${COMPANY.rut}`, margin + 16, 18.5);
  doc.text(COMPANY.addresses.join('   ·   '), margin + 16, 23);

  doc.setFontSize(9);
  doc.text(`Cotización N° ${quoteNumber}`, pageWidth - margin, 13, { align: 'right' });
  doc.text(`Fecha: ${dateStr}`, pageWidth - margin, 18.5, { align: 'right' });

  // --- Datos del cliente ---
  doc.setTextColor(15, 23, 42);
  let y = 42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Datos del Cliente', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 6;
  doc.text(`Cliente / Empresa: ${customer.name || 'No especificado'}`, margin, y);
  y += 5;
  doc.text(`RUT: ${customer.rut || 'No especificado'}`, margin, y);
  y += 5;
  doc.text(`Email: ${customer.email || 'No especificado'}`, margin, y);

  // --- Tabla de productos ---
  const rows = items.map((item) => [item.sku || '—', item.name, String(item.qty), formatPrice(item.price), formatPrice(item.price * item.qty)]);

  autoTable(doc, {
    startY: y + 8,
    head: [['SKU', 'Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 26 },
      2: { halign: 'right', cellWidth: 16 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  });

  // --- Totales ---
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const subtotal = totalAmount / 1.19;
  const iva = totalAmount - subtotal;

  let finalY = doc.lastAutoTable.finalY + 8;
  const labelX = pageWidth - margin - 45;
  const valueX = pageWidth - margin;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Subtotal Neto:', labelX, finalY);
  doc.text(formatPrice(subtotal), valueX, finalY, { align: 'right' });

  finalY += 5;
  doc.text('IVA (19%):', labelX, finalY);
  doc.text(formatPrice(iva), valueX, finalY, { align: 'right' });

  finalY += 7;
  doc.setDrawColor(...SLATE_200);
  doc.line(labelX, finalY - 4.5, valueX, finalY - 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total General:', labelX, finalY);
  doc.text(formatPrice(totalAmount), valueX, finalY, { align: 'right' });

  // --- Pie de página ---
  const footerY = doc.internal.pageSize.getHeight() - 16;
  doc.setDrawColor(...SLATE_200);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_500);
  doc.text('Cotización válida por 15 días. Sujeta a confirmación de stock.', margin, footerY);
  doc.text(
    `Datos para transferencia: Banco de Chile, Cta. Cte. N° 00-000-12345-6, a nombre de ${COMPANY.legalName}, RUT ${COMPANY.rut}.`,
    margin,
    footerY + 4
  );

  doc.save(`Cotizacion_Garachena_${quoteNumber}.pdf`);
  return quoteNumber;
}
