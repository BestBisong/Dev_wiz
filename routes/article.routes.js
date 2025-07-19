const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article.controller');

// Create new article
router.post('/create', articleController.createArticle);

// Get specific article
router.get('/:slug', articleController.getArticle);

// Get all published articles
router.get('/get', articleController.getAllArticles);

module.exports = router;
