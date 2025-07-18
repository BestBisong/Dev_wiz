const express = require('express');
const router = express.Router();
const CanvasController = require('../controllers/layout.controller');

router.post('/export-canvas', CanvasController.exportCanvas);

module.exports = router;
