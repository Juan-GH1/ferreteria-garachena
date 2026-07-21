const { Router } = require('express');
const { getSummary } = require('../controllers/admin.controller');
const { requireAdminKey } = require('../middleware/requireAdminKey');

const router = Router();

router.get('/summary', requireAdminKey, getSummary);

module.exports = router;
