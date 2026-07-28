import { useEffect } from 'react';

const DEFAULT_TITLE = 'Ferretería Garachena - Catálogo Profesional de Pinturas y Herramientas';

function upsertMeta(attr, key, content) {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Meta-tags dinámicos por ruta (título, descripción y OpenGraph).
 * Nota: al ser una SPA, estos tags se inyectan client-side — los crawlers que
 * ejecutan JS (Google) los ven, pero la mayoría de los scrapers de redes
 * sociales no. Para OG completo en redes se necesita SSR o prerender; los
 * defaults del index.html cubren el caso del sitio compartido como un todo.
 */
export function useMeta({ title, description, image, url, type = 'website' }) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:description', description);
    }
    if (title) upsertMeta('property', 'og:title', title);
    if (image) upsertMeta('property', 'og:image', image);
    if (url) upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', type);

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, image, url, type]);
}
