const express = require('express');
const router = express.Router();
const layoutController = require('../controllers/layout.controller');


router.post('/', layoutController.createLayout);


router.get('/:id', layoutController.getLayout);

module.exports = router;