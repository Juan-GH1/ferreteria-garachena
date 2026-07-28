/**
 * Protección mínima para endpoints administrativos (ej. import masivo).
 * Si ADMIN_API_KEY no está configurada, se deja pasar (modo desarrollo/demo).
 * En producción, definir ADMIN_API_KEY y exigir el header X-Admin-Key.
 */
function requireAdminKey(req, res, next) {
  const configuredKey = process.env.ADMIN_API_KEY;
  if (!configuredKey) {
    return next();
  }

  const providedKey = req.header('x-admin-key');
  if (providedKey !== configuredKey) {
    return res.status(401).json({ error: 'Clave de administrador inválida o ausente.' });
  }

  next();
}

module.exports = { requireAdminKey };
