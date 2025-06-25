const express = require('express');
const router = express.Router();
const layoutController = require('../controllers/layout.controller');

// Create and download layout
router.post('/', layoutController.createLayout);

// Get layout by ID
router.get('/:id', layoutController.getLayout);

module.exports = router;