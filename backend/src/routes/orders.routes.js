const { Router } = require('express');
const { createOrder } = require('../controllers/orders.controller');

const router = Router();

router.post('/', createOrder);

module.exports = router;
