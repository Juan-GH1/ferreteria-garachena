const { Router } = require('express');
const {
  getAllProducts,
  searchProducts,
  getProductById,
  getProductStock,
} = require('../controllers/products.controller');

const router = Router();

// El orden importa: /search debe declararse antes de /:id
// para que Express no interprete "search" como un id de producto.
router.get('/search', searchProducts);
router.get('/:id/stock', getProductStock);
router.get('/:id', getProductById);
router.get('/', getAllProducts);

module.exports = router;
