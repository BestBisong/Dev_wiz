const express = require('express');
const router = express.Router();
const CanvasController = require('../controllers/layout.controller');

router.post('/create', CanvasController.exportCanvas);

module.exports = router;
