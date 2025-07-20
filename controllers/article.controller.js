const Article = require('../models/article.model');
const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } = require("docx");
const { parse } = require('node-html-parser');
const slugify = require('slugify');
const { sanitize } = require('../utils/sanitizer');

// Enhanced HTML to DOCX converter with better styling support
function htmlToDocxParagraphs(html, styles = {}) {
  if (!html) return [new Paragraph({ text: '' })];

  const root = parse(html);
  const paragraphs = [];

  // Apply default styles from article page
  const defaultStyles = {
    fontFamily: styles.fontFamily || 'Calibri',
    fontSize: styles.fontSize || '22pt',
    color: styles.color || '000000',
    lineHeight: styles.lineHeight || 1.5
  };

  root.childNodes.forEach((node) => {
    if (node.nodeType === 3) { // Text node
      if (node.textContent.trim()) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: node.textContent,
            font: defaultStyles.fontFamily,
            size: defaultStyles.fontSize,
            color: defaultStyles.color
          })],
          spacing: { line: defaultStyles.lineHeight * 240 }
        }));
      }
    } else if (node.tagName === 'P' || node.tagName === 'DIV') {
      const children = [];
      let alignment = AlignmentType.LEFT;
      const paragraphStyles = { ...defaultStyles };

      // Check for alignment
      const style = node.getAttribute('style') || '';
      if (style.includes('text-align:center')) alignment = AlignmentType.CENTER;
      else if (style.includes('text-align:right')) alignment = AlignmentType.RIGHT;
      else if (style.includes('text-align:justify')) alignment = AlignmentType.JUSTIFIED;

      // Process child nodes with styling
      node.childNodes.forEach((child) => {
        if (child.nodeType === 3) { // Text node
          if (child.textContent.trim()) {
            children.push(new TextRun({
              text: child.textContent,
              font: paragraphStyles.fontFamily,
              size: paragraphStyles.fontSize,
              color: paragraphStyles.color
            }));
          }
        } else if (child.tagName === 'SPAN' || child.tagName === 'FONT') {
          const textRunOptions = {
            text: child.textContent,
            font: paragraphStyles.fontFamily,
            size: paragraphStyles.fontSize
          };

          const childStyle = child.getAttribute('style') || '';
          const colorMatch = childStyle.match(/color:\s*(#[0-9a-f]+|rgb\([^)]+\)|rgba\([^)]+\))/i);
          if (colorMatch) textRunOptions.color = colorMatch[1].replace('#', '');

          if (childStyle.includes('font-weight:bold')) textRunOptions.bold = true;
          if (childStyle.includes('font-style:italic')) textRunOptions.italics = true;
          if (childStyle.includes('text-decoration:underline')) textRunOptions.underline = {};
          if (childStyle.includes('font-family')) {
            textRunOptions.font = childStyle.match(/font-family:\s*([^;]+)/i)[1];
          }
          if (childStyle.includes('font-size')) {
            textRunOptions.size = childStyle.match(/font-size:\s*([^;]+)/i)[1];
          }

          children.push(new TextRun(textRunOptions));
        } else if (child.tagName === 'STRONG' || child.tagName === 'B') {
          children.push(new TextRun({
            text: child.textContent,
            bold: true,
            font: paragraphStyles.fontFamily,
            size: paragraphStyles.fontSize,
            color: paragraphStyles.color
          }));
        } else if (child.tagName === 'EM' || child.tagName === 'I') {
          children.push(new TextRun({
            text: child.textContent,
            italics: true,
            font: paragraphStyles.fontFamily,
            size: paragraphStyles.fontSize,
            color: paragraphStyles.color
          }));
        } else if (child.tagName === 'H1' || child.tagName === 'H2' || child.tagName === 'H3') {
          const headingLevel = child.tagName === 'H1' ? HeadingLevel.HEADING_1 :
                              child.tagName === 'H2' ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
          paragraphs.push(new Paragraph({
            text: child.textContent,
            heading: headingLevel,
            alignment,
            spacing: { line: defaultStyles.lineHeight * 240 }
          }));
        }
      });

      if (children.length > 0) {
        paragraphs.push(new Paragraph({
          children,
          alignment,
          spacing: { line: defaultStyles.lineHeight * 240 }
        }));
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
    let attempts = 0;
    while (attempts < 5) {
      const existingArticle = await Article.findOne({ slug });
      if (!existingArticle) break;
      slug = `${slug}-${Math.random().toString(36).substring(2, 5)}`;
      attempts++;
    }

    // Create article in DB
    const article = await Article.create({
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

    // Create Word document with article styling
    const doc = new Document({
      styles: {
        paragraphStyles: [{
          id: "Normal",
          name: "Normal",
          run: {
            font: styles?.fontFamily || "Calibri",
            size: styles?.fontSize || "24pt",
            color: styles?.color || "000000"
          },
          paragraph: {
            spacing: { line: (styles?.lineHeight || 1.5) * 240 }
          }
        }]
      },
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Published on: ${new Date().toLocaleDateString()}`,
                bold: true,
              }),
            ],
            spacing: { after: 200 },
          }),
          ...htmlToDocxParagraphs(sanitizedContent, styles),
          new Paragraph({
            text: `Read online: ${articleUrl}`,
            spacing: { before: 400 },
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    // Generate the document buffer
    const buffer = await Packer.toBuffer(doc);

    // Set response headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${slug}.docx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // Send both the file and the article URL
    res.status(201).json({
      status: 'success',
      data: {
        download: buffer.toString('base64'),
        articleUrl: articleUrl,
        articleId: article._id
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

// Get article URL endpoint
exports.getArticleUrl = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({
        status: 'fail',
        message: 'Article not found'
      });
    }

    const articleUrl = `${req.protocol}://${req.get('host')}/articles/${article.slug}`;
    
    res.status(200).json({
      status: 'success',
      data: {
        articleUrl
      }
    });
  } catch (error) {
    console.error('Error getting article URL:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get article URL',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};