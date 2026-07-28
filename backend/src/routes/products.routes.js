const { Router } = require('express');
const {
  getAllProducts,
  searchProducts,
  getProductById,
  getProductStock,
  updateProduct,
} = require('../controllers/products.controller');
const { importProducts, upload } = require('../controllers/import.controller');
const { requireAdminKey } = require('../middleware/requireAdminKey');

const router = Router();

// El orden importa: /search debe declararse antes de /:id
// para que Express no interprete "search" como un id de producto.
router.get('/search', searchProducts);
router.get('/:id/stock', getProductStock);
router.get('/:id', getProductById);
router.get('/', getAllProducts);
router.put('/:id', requireAdminKey, updateProduct);

// Errores de multer (extensión no soportada, archivo demasiado grande) se
// devuelven como 400 con mensaje claro en vez del 500 genérico por defecto.
router.post('/import', requireAdminKey, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'No se pudo procesar el archivo subido.' });
    }
    next();
  });
}, importProducts);

module.exports = router;
