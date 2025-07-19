const Article = require('../models/article.model');
const Layout = require('../models/layout.model');
const mongoose = require('mongoose');
const slugify = require('slugify');
const { sanitize } = require('../utils/sanitizer');
const cache = require('../services/cache.service');
const { Document, Paragraph, TextRun, HeadingLevel, Packer } = require("docx");

const CACHE_DURATION = 3600; // 1 hour cache

// Create and publish article
exports.createArticle = async (req, res) => {
  try {
    const { title, content, layoutId, metaTitle, metaDescription, keywords, ogImage, styles } = req.body;
    
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

    // Create Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: {
              after: 200,
            },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Published on: " + new Date().toLocaleDateString(),
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            text: sanitizedContent,
            spacing: {
              line: 276, // 1.15 line spacing
            },
          }),
          new Paragraph({
            text: "Article URL: " + articleUrl,
            spacing: {
              before: 200,
            },
          }),
        ],
      }],
    });

    // Generate the Word document buffer
    const buffer = await Packer.toBuffer(doc);

    // Set response headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${slug}.docx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // Send the document
    res.status(201).send(buffer);

  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};