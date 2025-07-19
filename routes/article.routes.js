const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article.controller');

// Create new article
router.post('/create', articleController.createArticle);

module.exports = router;
