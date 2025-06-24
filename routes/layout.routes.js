const express = require('express');
const router = express.Router();
const layoutController = require('../controllers/layout.controller');

router.post('/create', layoutController.createLayout);
router.get('/', layoutController.getLayouts);
router.get('/get/:id', layoutController.getLayoutById);
router.get('/preview/:id', layoutController.previewLayout);
router.get('/download/html/:id', layoutController.downloadHTML);
router.get('/download/zip/:id', layoutController.downloadZip);

module.exports = router;