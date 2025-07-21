const Article = require('../models/article.model');
const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } = require("docx");
const { parse } = require('node-html-parser');
const slugify = require('slugify');
const { sanitize } = require('../utils/sanitizer');

const COLOR_PALETTE = {
  '000000': 'Black', 'FFFFFF': 'White', 'FF0000': 'Red', '00FF00': 'Green', '0000FF': 'Blue',
  'FFFF00': 'Yellow', 'FF00FF': 'Magenta', '00FFFF': 'Cyan', '800000': 'Maroon', '008000': 'DarkGreen',
  '000080': 'Navy', '808000': 'Olive', '800080': 'Purple', '008080': 'Teal', 'C0C0C0': 'Silver', '808080': 'Gray'
};

// Normalize color input to 6-digit HEX
function normalizeColor(color) {
  if (!color || typeof color !== 'string') return '000000';
  color = color.trim().toLowerCase();

  const hexMatch = color.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    return hex.length === 3 ? hex.split('').map(c => c + c).join('').toUpperCase() : hex.toUpperCase();
  }

  const paletteEntry = Object.entries(COLOR_PALETTE).find(([hex, name]) => name.toLowerCase() === color);
  if (paletteEntry) return paletteEntry[0];

  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
      .map(n => Math.min(255, Math.max(0, parseInt(n))).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  return '000000';
}

// Safely convert px size to DOCX half-points (DOCX uses "half-points")
function safeFontSize(sizePx, fallback = 22) {
  const size = parseFloat(sizePx);
  return isNaN(size) ? fallback : Math.max(8, Math.min(72, size)) * 2;
}

// Ensure content is HTML-safe
function safeContentToHtml(content) {
  if (typeof content === 'object') {
    return `<pre>${JSON.stringify(content, null, 2)}</pre>`;
  }
  if (typeof content === 'string') {
    return content.trim();
  }
  return '<p>No content provided</p>';
}

// Convert HTML to DOCX Paragraphs, preserving inline styles
function htmlToDocxParagraphs(html, globalStyles = {}) {
  const root = parse(html);

  const defaultStyles = {
    fontFamily: globalStyles.fontFamily || "Calibri",
    size: safeFontSize(globalStyles.fontSize, 22),
    color: normalizeColor(globalStyles.color),
    lineHeight: globalStyles.lineHeight ? parseFloat(globalStyles.lineHeight) : 1.5
  };

  // Recursively parse nodes, preserving inherited styles
  const parseNode = (node, parentStyles = {}) => {
    const currentStyles = { ...parentStyles };

    if (node.nodeType === 3) { // Text node
      const text = node.rawText.replace(/\s+/g, " ");
      if (!text.trim()) return [];

      return [new TextRun({
        text: text,
        font: currentStyles.fontFamily || defaultStyles.fontFamily,
        size: currentStyles.size || defaultStyles.size,
        color: currentStyles.color || defaultStyles.color,
        bold: currentStyles.bold || false,
        italics: currentStyles.italics || false,
        underline: currentStyles.underline || undefined
      })];
    }

    if (node.nodeType === 1) { // Element node

      const style = node.getAttribute("style") || "";

      // Parse inline styles and update currentStyles
      const colorMatch = style.match(/color:\s*([^;]+)/i);
      if (colorMatch) currentStyles.color = normalizeColor(colorMatch[1]);

      const fontMatch = style.match(/font-family:\s*([^;]+)/i);
      if (fontMatch) currentStyles.fontFamily = fontMatch[1].replace(/['"]/g, "").split(",")[0].trim();

      const sizeMatch = style.match(/font-size:\s*([\d.]+)px/i);
      if (sizeMatch) currentStyles.size = safeFontSize(sizeMatch[1]);

      if (style.includes("font-weight:bold") || ["B", "STRONG"].includes(node.tagName)) currentStyles.bold = true;
      if (style.includes("font-style:italic") || ["I", "EM"].includes(node.tagName)) currentStyles.italics = true;
      if (style.includes("text-decoration:underline") || node.tagName === "U") currentStyles.underline = {};

      // Handle <br> as a line break
      if (node.tagName === "BR") {
        return [new TextRun({ text: "\n" })];
      }

      // Recursively process child nodes
      let runs = [];
      node.childNodes.forEach(child => {
        runs = runs.concat(parseNode(child, currentStyles));
      });

      return runs;
    }

    return [];
  };

  const paragraphs = [];

  root.childNodes.forEach(node => {
    let alignment = AlignmentType.LEFT;
    const style = node.getAttribute ? node.getAttribute("style") || "" : "";

    if (/text-align:\s*center/i.test(style)) alignment = AlignmentType.CENTER;
    else if (/text-align:\s*right/i.test(style)) alignment = AlignmentType.RIGHT;
    else if (/text-align:\s*justify/i.test(style)) alignment = AlignmentType.JUSTIFIED;

    const runs = parseNode(node, defaultStyles);

    if (runs.length > 0) {
      paragraphs.push(new Paragraph({
        children: runs,
        alignment,
        spacing: { line: defaultStyles.lineHeight * 240 } // DOCX uses 240 = 1.5x spacing
      }));
    }
  });

  if (paragraphs.length === 0) {
    return [new Paragraph({ text: " " })];
  }

  return paragraphs;
}

exports.createArticle = async (req, res) => {
  try {
    const { title, content, styles = {} } = req.body;

    // Validate title and content
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ status: 'fail', message: 'A valid title is required' });
    }

    if (!content) {
      return res.status(400).json({ status: 'fail', message: 'Content is required' });
    }

    // Generate unique slug
    let slug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }).substring(0, 100);
    let attempts = 0;
    while (attempts < 5) {
      const exists = await Article.findOne({ slug }).lean();
      if (!exists) break;
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
      attempts++;
    }

    const defaultStyles = {
      fontFamily: styles.fontFamily || 'Calibri',
      fontSize: styles.fontSize || 11,
      size: safeFontSize(styles.fontSize, 22),
      color: normalizeColor(styles.color),
      lineHeight: styles.lineHeight || 1.5
    };

    const safeHtml = safeContentToHtml(content);
    const paragraphs = htmlToDocxParagraphs(safeHtml, styles);

    // Save to MongoDB
    const article = await Article.create({
      title: sanitize(title),
      content: sanitize(safeHtml),
      slug,
      isPublished: true,
      publishedAt: new Date(),
      styles: defaultStyles
    });

    const articleUrl = `${req.protocol}://${req.get('host')}/articles/${article.slug}`;

    // Create DOCX document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400, before: 400 }
          }),
          ...paragraphs,
          new Paragraph({
            text: `Read online: ${articleUrl}`,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 }
          })
        ]
      }]
    });

    // Send DOCX as download
    const buffer = await Packer.toBuffer(doc);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${slug}.docx"`,
      'Content-Length': buffer.length
    });

    res.send(buffer);

  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create article',
      error: process.env.NODE_ENV === 'development' ? { message: error.message, stack: error.stack } : undefined
    });
  }
};
