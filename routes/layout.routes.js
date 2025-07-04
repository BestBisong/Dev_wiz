const express = require('express');
const router = express.Router();
const layoutController = require('../controllers/layout.controller');

router.post('/create', layoutController.createLayout);
router.get('/:Id', layoutController.getLayout);

module.exports = router;