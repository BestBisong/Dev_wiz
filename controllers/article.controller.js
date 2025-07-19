const Article = require('../models/article.model');
const { Document, Paragraph, TextRun, HeadingLevel, Packer } = require("docx");
const { parse } = require('node-html-parser');
const slugify = require('slugify');
const { sanitize } = require('../utils/sanitizer');

// Helper: Convert HTML to docx Paragraphs with styling
function htmlToDocxParagraphs(html) {
  if (!html) return [new Paragraph({ text: '' })];
  
  const root = parse(html);
  const paragraphs = [];

  root.childNodes.forEach((node) => {
    if (node.nodeType === 3) { // Text node
      if (node.textContent.trim()) {
        paragraphs.push(new Paragraph({ children: [new TextRun(node.textContent)] }));
      }
    } else if (node.tagName === 'P' || node.tagName === 'DIV') {
      const children = [];
      let alignment = 'left';

      // Check for alignment (left/right/center/justify)
      const style = node.getAttribute('style') || '';
      if (style.includes('text-align:center')) alignment = 'center';
      else if (style.includes('text-align:right')) alignment = 'right';
      else if (style.includes('text-align:justify')) alignment = 'both';

      // Process child nodes (spans, strong, em, etc.)
      node.childNodes.forEach((child) => {
        if (child.nodeType === 3) { // Text node
          if (child.textContent.trim()) {
            children.push(new TextRun(child.textContent));
          }
        } else if (child.tagName === 'SPAN' || child.tagName === 'FONT') {
          const textRunOptions = { text: child.textContent };
          const childStyle = child.getAttribute('style') || '';

          // Handle color
          const colorMatch = childStyle.match(/color:\s*(#[0-9a-f]+|rgb\([^)]+\)|rgba\([^)]+\))/i);
          if (colorMatch) textRunOptions.color = colorMatch[1].replace('#', '');

          // Handle font styles
          if (childStyle.includes('font-weight:bold')) textRunOptions.bold = true;
          if (childStyle.includes('font-style:italic')) textRunOptions.italics = true;
          if (childStyle.includes('text-decoration:underline')) textRunOptions.underline = {};

          children.push(new TextRun(textRunOptions));
        } else if (child.tagName === 'STRONG' || child.tagName === 'B') {
          children.push(new TextRun({ text: child.textContent, bold: true }));
        } else if (child.tagName === 'EM' || child.tagName === 'I') {
          children.push(new TextRun({ text: child.textContent, italics: true }));
        }
      });

      if (children.length > 0) {
        paragraphs.push(new Paragraph({ children, alignment }));
      }
    }
  });

  return paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: '' })];
}

// Create and publish article
exports.createArticle = async (req, res) => {
  try {
    const { title, content, layoutId, metaTitle, metaDescription, keywords, styles } = req.body;

    // Create slug and sanitize content
   let slug = slugify(title, { lower: true, strict: true });
    const sanitizedContent = sanitize(content);

      // Check if slug exists and make it unique
    const existingArticle = await Article.findOne({ slug });
    if (existingArticle) {
    slug = ` ${slug}-${Math.random().toString(36).substring(2, 5)}`;
    }

    // Create article in DB
     let article = await Article.create({
      title: sanitize(title),
      content: sanitizedContent,
      layout: layoutId,
      slug,
      isPublished: true,
      publishedAt: Date.now(),
      metaTitle: metaTitle ? sanitize(metaTitle) : undefined,
      metaDescription: metaDescription ? sanitize(metaDescription) : undefined,
      keywords: keywords ? keywords.map(k => sanitize(k)) : [],
      styles: styles
    });

    // Generate public URL
    const articleUrl = `${req.protocol}://${req.get('host')}/articles/${article.slug}`;

    // Create Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title (centered)
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: 'center',
            spacing: { after: 200 },
          }),
          // Publish date
          new Paragraph({
            children: [
              new TextRun({
                text: `Published on: ${new Date().toLocaleDateString()}`,
                bold: true,
              }),
            ],
          }),
          // Content (converted from HTML)
          ...htmlToDocxParagraphs(sanitizedContent),
          // Article URL
          new Paragraph({
            text: `Article URL: ${articleUrl}`,
            spacing: { before: 200 },
          }),
        ],
      }],
    });

    // Generate and send the document
    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Disposition', `attachment; filename="${slug}.docx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
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