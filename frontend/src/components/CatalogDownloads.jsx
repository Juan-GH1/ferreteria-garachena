import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FlaskConical, HardHat, Loader2, Palette, Wrench } from 'lucide-react';
import { generateCatalogPdf } from '../utils/generateCatalogPdf';

const EASE = { duration: 0.35, ease: 'easeOut' };

// Mismas 4 líneas y valores reales de product.category que CategoryGrid.jsx.
const CATALOGS = [
  { label: 'Pinturas', icon: Palette, values: ['Pinturas', 'Pinturas & Tintometría'] },
  { label: 'Herramientas Manuales', icon: Wrench, values: ['Herramientas Manuales'] },
  { label: 'Línea Construcción', icon: HardHat, values: ['Línea Construcción'] },
  { label: 'Aseo y Químicos', icon: FlaskConical, values: ['Aseo y Químicos'] },
];

/**
 * Catálogos de precios descargables en PDF, generados al vuelo a partir del
 * catálogo real ya cargado por Catalog.jsx (sin pegarle otra vez al backend
 * ni inventar productos). Cada tarjeta solo se muestra si esa línea
 * efectivamente tiene productos con stock en el catálogo actual.
 */
export default function CatalogDownloads({ products }) {
  const [downloadingLabel, setDownloadingLabel] = useState(null);

  const available = useMemo(
    () =>
      CATALOGS.map((cat) => ({
        ...cat,
        items: products.filter((p) => cat.values.includes(p.category)),
      })).filter((cat) => cat.items.length > 0),
    [products]
  );

  if (!available.length) return null;

  async function handleDownload(catalog) {
    setDownloadingLabel(catalog.label);
    try {
      await generateCatalogPdf({ products: catalog.items, categoryLabel: catalog.label });
    } finally {
      setDownloadingLabel(null);
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 pb-16">
      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 font-medium text-center">Recursos Descargables</p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 text-center">
        Catálogos en PDF por Línea
      </h2>
      <p className="mt-2 text-[13px] text-neutral-500 text-center max-w-lg mx-auto">
        Lista de precios generada al momento, con los productos y valores vigentes del catálogo en línea.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {available.map((cat, index) => {
          const isDownloading = downloadingLabel === cat.label;
          return (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ ...EASE, delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-neutral-100 p-6 flex flex-col gap-3"
            >
              <span className="w-10 h-10 rounded-xl bg-neutral-50 text-neutral-800 flex items-center justify-center">
                <cat.icon className="w-4.5 h-4.5" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight text-neutral-900">{cat.label}</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {cat.items.length} producto{cat.items.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(cat)}
                disabled={isDownloading}
                className="mt-1 inline-flex items-center justify-center gap-2 border-2 border-neutral-900 text-neutral-900 text-[12px] font-semibold tracking-tight px-4 py-2.5 rounded-full hover:bg-neutral-900 hover:text-white transition-colors disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-neutral-900"
              >
                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {isDownloading ? 'Generando...' : 'Descargar PDF'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
