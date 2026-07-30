import { formatPrice } from './format';

// Mismos datos de encabezado que generateQuotePdf.js (demostración, no una
// empresa real) para que ambos documentos se vean como parte del mismo
// sistema de marca.
const COMPANY = {
  name: 'FERRETERÍA GARACHENA',
  legalName: 'J. Garachena S.A.',
  rut: '76.890.123-4',
  addresses: ['Av. Providencia 1234, Providencia', 'Av. Vitacura 5678, Vitacura'],
};

const NAVY = [11, 31, 63];
const SLATE_500 = [100, 116, 139];
const SLATE_200 = [226, 232, 240];

function slugify(label) {
  return label
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Genera y descarga una lista de precios en PDF a partir de productos reales
 * ya cargados en el catálogo (sin pegarle otra vez al backend). A diferencia
 * de generateB2BQuotePdf, no lleva datos de cliente ni cantidades: es un
 * catálogo de referencia por línea de producto, no una cotización.
 */
export async function generateCatalogPdf({ products, categoryLabel }) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
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
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${COMPANY.legalName} · RUT ${COMPANY.rut}`, margin + 16, 18.5);
  doc.text(COMPANY.addresses.join('   ·   '), margin + 16, 23);

  doc.setFontSize(9);
  doc.text(`Catálogo: ${categoryLabel}`, pageWidth - margin, 13, { align: 'right' });
  doc.text(`Actualizado: ${dateStr}`, pageWidth - margin, 18.5, { align: 'right' });

  // --- Título y resumen ---
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(categoryLabel, margin, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_500);
  doc.text(`${products.length} producto${products.length === 1 ? '' : 's'} con stock verificado en Providencia y Vitacura`, margin, 48);

  // --- Tabla de productos ---
  const rows = products.map((p) => [p.sku || '—', p.name, p.brand || '—', formatPrice(p.price)]);

  autoTable(doc, {
    startY: 54,
    head: [['SKU', 'Descripción', 'Marca', 'Precio']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { cellWidth: 35 },
      3: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
    // Pie repetido en cada página (el catálogo puede abarcar varias hojas).
    didDrawPage: () => {
      const footerY = doc.internal.pageSize.getHeight() - 10;
      doc.setDrawColor(...SLATE_200);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE_500);
      doc.text('Precios en pesos chilenos (CLP), IVA incluido. Sujetos a variación y disponibilidad de stock.', margin, footerY);
    },
  });

  doc.save(`Catalogo_Garachena_${slugify(categoryLabel)}.pdf`);
}
