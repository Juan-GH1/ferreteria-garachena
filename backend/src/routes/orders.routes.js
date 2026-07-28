const { Router } = require('express');
const { createOrder, listOrders, updateOrderStatus } = require('../controllers/orders.controller');
const { requireAdminKey } = require('../middleware/requireAdminKey');

const router = Router();

router.get('/', requireAdminKey, listOrders);
router.post('/', createOrder);
router.patch('/:id/status', requireAdminKey, updateOrderStatus);

module.exports = router;
