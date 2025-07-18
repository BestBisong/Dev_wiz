const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article.controller');

// Create new article
router.post('/', articleController.createArticle);

// Get specific article
router.get('/:slug', articleController.getArticle);

// Get all published articles
router.get('/', articleController.getAllArticles);

module.exports = router;