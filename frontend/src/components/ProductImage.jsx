import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, HardHat, Package, Wrench } from 'lucide-react';

// Los 1013 productos importados de Sisgen comparten esta misma foto genérica
// (asignada por scripts/import-familia-pinturas.js a falta de fotos reales).
// Cualquier producto con esta URL exacta recibe la ilustración vectorial en
// vez de repetir la misma foto mil veces.
const GENERIC_PLACEHOLDER_URL = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600';

const TOOL_ICON_BY_CATEGORY = {
  'Herramientas Manuales': Wrench,
  'Línea Construcción': HardHat,
  'Aseo y Químicos': FlaskConical,
};

function isPaintCategory(category) {
  return category === 'Pinturas' || category === 'Pinturas & Tintometría';
}

function hashSeed(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function GarachenaMark({ className, style }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} style={style} aria-hidden>
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" />
      <path d="M26 20 V80 H38 V20 Z" fill="currentColor" />
      <path d="M44 20 V80 H47 V20 Z" fill="currentColor" />
    </svg>
  );
}

/** Tarro de pintura vectorial con nivel de color derivado del producto (mismo SKU = mismo color siempre). */
function PaintCanIllustration({ seed }) {
  const hue = hashSeed(seed) % 360;
  const fill = `hsl(${hue} 55% 55%)`;
  const fillDark = `hsl(${hue} 55% 40%)`;
  const bg = `hsl(${hue} 45% 95%)`;

  return (
    <div
      className="w-full h-full flex items-center justify-center p-6"
      style={{ background: `radial-gradient(circle at 50% 30%, ${bg}, white 72%)` }}
    >
      <svg viewBox="0 0 120 140" className="w-full h-full max-w-[170px] drop-shadow-sm">
        <path d="M40 34 Q60 10 80 34" stroke="#94a3b8" strokeWidth="4" fill="none" strokeLinecap="round" />
        <rect x="28" y="27" width="64" height="16" rx="4" fill="#cbd5e1" />
        <rect x="24" y="39" width="72" height="11" rx="3" fill="#e2e8f0" />
        <path d="M30 50 L34 128 Q60 136 86 128 L90 50 Z" fill="white" stroke="#e2e8f0" strokeWidth="2" />
        <path d="M32 78 L35 128 Q60 135 85 128 L88 78 Q60 87 32 78 Z" fill={fill} />
        <ellipse cx="60" cy="78" rx="28" ry="7" fill={fillDark} opacity="0.5" />
        <rect x="40" y="93" width="40" height="19" rx="3" fill="white" opacity="0.92" />
        <text x="60" y="106" textAnchor="middle" fontSize="7" fontWeight="700" fill={fillDark} fontFamily="system-ui, sans-serif" letterSpacing="0.5">
          GARACHENA
        </text>
      </svg>
    </div>
  );
}

/** Ícono estilizado sobre fondo pastel para categorías no-pintura, con marca Garachena de fondo. */
function ToolIllustration({ category, seed }) {
  const Icon = TOOL_ICON_BY_CATEGORY[category] || Package;
  const hue = hashSeed(seed) % 360;
  const bg = `hsl(${hue} 55% 95%)`;
  const iconColor = `hsl(${hue} 45% 40%)`;

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      style={{ background: `radial-gradient(circle at 50% 35%, ${bg}, white 78%)` }}
    >
      <div className="w-[55%] h-[55%] max-w-20 max-h-20 aspect-square rounded-2xl bg-white shadow-card flex items-center justify-center">
        <Icon className="w-[45%] h-[45%]" style={{ color: iconColor }} />
      </div>
      <GarachenaMark className="absolute bottom-[8%] right-[8%] w-[16%] h-[16%] max-w-5 max-h-5 opacity-[0.15]" style={{ color: iconColor }} />
    </div>
  );
}

/**
 * Imagen de producto con fallback vectorial inteligente. Si el producto no
 * tiene foto propia (o comparte la foto genérica del import masivo), se
 * genera una ilustración determinística por categoría en vez de mostrar una
 * tarjeta vacía o la misma foto repetida mil veces.
 *
 * `className` se aplica al contenedor raíz (define aspecto/bordes/sombra);
 * el fondo, el padding y el fade-in de la foto real los maneja el propio
 * componente. `skeleton` activa un placeholder pulsante mientras la foto
 * real carga (pensado para la ficha de producto, donde la imagen es grande
 * y el LCP de la página); en la grilla no hace falta por ser miniaturas
 * lazy. `onReady` se dispara cuando el contenido visual está listo.
 */
export default function ProductImage({ product, className = '', loading = 'lazy', fetchPriority, skeleton = false, onReady }) {
  const [loaded, setLoaded] = useState(false);
  const hasRealPhoto = Boolean(product.image_url) && product.image_url !== GENERIC_PLACEHOLDER_URL;

  useEffect(() => {
    if (!hasRealPhoto) onReady?.();
  }, [hasRealPhoto, onReady]);

  if (hasRealPhoto) {
    return (
      <div className={`relative flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/60 overflow-hidden ${className}`}>
        {skeleton && !loaded && <div className="absolute inset-6 rounded-2xl bg-slate-100 animate-pulse" aria-hidden />}
        <motion.img
          src={product.image_url}
          alt={product.name}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          onLoad={() => {
            setLoaded(true);
            onReady?.();
          }}
          initial={false}
          animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.97 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative object-contain max-h-full max-w-full p-6 group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    );
  }

  const seed = product.sku || product.name || String(product.id ?? 'garachena');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`relative overflow-hidden ${className}`}
    >
      {isPaintCategory(product.category) ? (
        <PaintCanIllustration seed={seed} />
      ) : (
        <ToolIllustration category={product.category} seed={seed} />
      )}
    </motion.div>
  );
}
