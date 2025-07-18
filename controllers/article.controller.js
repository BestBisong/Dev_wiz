const Article = require('../models/article.model');
const Layout = require('../models/layout.model');
const mongoose = require('mongoose');
const slugify = require('slugify');
const { sanitize } = require('../utils/sanitizer');
const cache = require('../services/cache.service');

const CACHE_DURATION = 3600; // 1 hour cache

// Create and publish article
exports.createArticle = async (req, res) => {
  try {
    const { title, content, layoutId, metaTitle, metaDescription, keywords, ogImage } = req.body;
    
    // Validate required fields
    if (!title || !content || !layoutId) {
      return res.status(400).json({
        status: 'error',
        message: 'Title, content, and layout ID are required'
      });
    }

    // Validate layout
    if (!mongoose.Types.ObjectId.isValid(layoutId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid layout ID format'
      });
    }

    const layout = await Layout.findById(layoutId);
    if (!layout) {
      return res.status(404).json({
        status: 'error',
        message: 'Layout not found'
      });
    }

    // Create slug and sanitize content
    const slug = slugify(title, { lower: true, strict: true });
    const sanitizedContent = sanitize(content);

    // Create article
    const article = await Article.create({
      title: sanitize(title),
      content: sanitizedContent,
      layout: layoutId,
      slug,
      isPublished: true,
      publishedAt: Date.now(),
      metaTitle: metaTitle ? sanitize(metaTitle) : undefined,
      metaDescription: metaDescription ? sanitize(metaDescription) : undefined,
      keywords: keywords ? keywords.map(k => sanitize(k)) : []
    });

    // Generate public URL
    const articleUrl = `${req.protocol}://${req.get('host')}/articles/${article.slug}`;

    res.status(201).json({
      status: 'success',
      data: {
        article,
        url: articleUrl
      }
    });

  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single article
exports.getArticle = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `article:${slug}`;

    // Try cache first
    const cachedArticle = await cache.get(cacheKey);
    if (cachedArticle) {
      return res.json({
        status: 'success',
        fromCache: true,
        data: JSON.parse(cachedArticle)
      });
    }

    // Get from database
    const article = await Article.findOne({ slug, isPublished: true })
      .populate('layout');

    if (!article) {
      return res.status(404).json({
        status: 'error',
        message: 'Article not found or not published'
      });
    }

    // Cache the article
    await cache.set(cacheKey, JSON.stringify(article), CACHE_DURATION);

    res.json({
      status: 'success',
      fromCache: false,
      data: article
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all published articles
exports.getAllArticles = async (req, res) => {
  try {
    const cacheKey = 'all:articles';
    const cachedArticles = await cache.get(cacheKey);

    if (cachedArticles) {
      return res.json({
        status: 'success',
        fromCache: true,
        data: JSON.parse(cachedArticles)
      });
    }

    const articles = await Article.find({ isPublished: true })
      .sort({ publishedAt: -1 })
      .populate('layout', 'name');

    await cache.set(cacheKey, JSON.stringify(articles), CACHE_DURATION);

    res.json({
      status: 'success',
      fromCache: false,
      data: articles
    });

  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch articles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};