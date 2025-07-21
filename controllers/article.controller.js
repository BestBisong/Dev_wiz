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

function jsonToDocxParagraphs(jsonArray, defaultStyles) {
  const paragraphs = [];

  jsonArray.forEach(element => {
    const type = element.type || 'paragraph';
    const text = element.text || '';
    const style = element.style || {};

    const runOptions = {
      text,
      font: style.fontFamily || defaultStyles.font,
      size: style.fontSize ? Math.max(8, Math.min(72, parseInt(style.fontSize))) * 2 : defaultStyles.size,
      color: style.color ? normalizeColor(style.color) : defaultStyles.color,
      bold: style.bold || false,
      italics: style.italics || false,
      underline: style.underline ? {} : false
    };

    const run = new TextRun(runOptions);

    let paragraphOptions = {
      children: [run],
      spacing: { line: defaultStyles.lineHeight * 240 }
    };

    if (type === 'heading') {
      if (element.level === 1) paragraphOptions.heading = HeadingLevel.HEADING_1;
      if (element.level === 2) paragraphOptions.heading = HeadingLevel.HEADING_2;
      if (element.level === 3) paragraphOptions.heading = HeadingLevel.HEADING_3;
    }

    if (style.alignment) {
      const align = style.alignment.toLowerCase();
      if (align === 'center') paragraphOptions.alignment = AlignmentType.CENTER;
      if (align === 'right') paragraphOptions.alignment = AlignmentType.RIGHT;
      if (align === 'justify') paragraphOptions.alignment = AlignmentType.JUSTIFIED;
    }

    paragraphs.push(new Paragraph(paragraphOptions));
  });

  return paragraphs;
}

function htmlToDocxParagraphs(html, styles = {}) {
  try {
    if (!html || typeof html !== 'string') {
      return [new Paragraph({ text: 'No content available' })];
    }

    html = html.trim();
    const isPlainText = !html.includes('<') && !html.includes('>');

    const defaultStyles = {
      font: (typeof styles.fontFamily === 'string' && styles.fontFamily.trim()) || 'Calibri',
      size: styles.fontSize ? Math.max(8, Math.min(72, parseInt(styles.fontSize))) * 2 : 22,
      color: normalizeColor(styles.color),
      lineHeight: styles.lineHeight ? Math.min(3, Math.max(1, parseFloat(styles.lineHeight))) : 1.5
    };

    if (isPlainText) {
      const lines = html.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      return lines.map(line => new Paragraph({
        children: [new TextRun({
          text: line,
          font: defaultStyles.font,
          size: defaultStyles.size,
          color: defaultStyles.color
        })],
        spacing: { line: defaultStyles.lineHeight * 240 }
      }));
    }

    const root = parse(html);
    const paragraphs = [];

    const processNode = (node, inheritedStyles = {}) => {
      const runs = [];

      if (node.nodeType === 3) {
        const text = node.textContent.trim();
        if (text.length > 0) {
          runs.push(new TextRun({
            text,
            font: inheritedStyles.font || defaultStyles.font,
            size: inheritedStyles.size || defaultStyles.size,
            color: inheritedStyles.color || defaultStyles.color,
            bold: inheritedStyles.bold || false,
            italics: inheritedStyles.italics || false,
            underline: inheritedStyles.underline || false
          }));
        }
      } else if (node.tagName) {
        const tag = node.tagName.toUpperCase();
        const style = node.getAttribute('style') || '';

        const newStyles = { ...inheritedStyles };

        const colorMatch = style.match(/color:\s*([^;]+)/i);
        if (colorMatch) newStyles.color = normalizeColor(colorMatch[1]);

        const fontMatch = style.match(/font-family:\s*([^;]+)/i);
        if (fontMatch) newStyles.font = fontMatch[1].replace(/['"]/g, '').split(',')[0].trim();

        const sizeMatch = style.match(/font-size:\s*(\d+)px/i);
        if (sizeMatch) {
          newStyles.size = Math.max(8, Math.min(72, parseInt(sizeMatch[1]))) * 2;
        }

        if (style.includes('font-weight:bold') || ['B', 'STRONG'].includes(tag)) newStyles.bold = true;
        if (style.includes('font-style:italic') || ['I', 'EM'].includes(tag)) newStyles.italics = true;
        if (style.includes('text-decoration:underline') || tag === 'U') newStyles.underline = {};

        node.childNodes.forEach(child => {
          runs.push(...processNode(child, newStyles));
        });
      }

      return runs;
    };

    root.childNodes.forEach(node => {
      if (!node || typeof node !== 'object') return;

      const runs = node.nodeType === 3
        ? processNode(node, defaultStyles)
        : node.tagName
          ? processNode(node, defaultStyles)
          : [];

      if (runs.length > 0) {
        let alignment = AlignmentType.LEFT;

        if (node.tagName) {
          const style = node.getAttribute('style') || '';
          if (style.includes('text-align:center')) alignment = AlignmentType.CENTER;
          else if (style.includes('text-align:right')) alignment = AlignmentType.RIGHT;
          else if (style.includes('text-align:justify')) alignment = AlignmentType.JUSTIFIED;
        }

        paragraphs.push(new Paragraph({
          children: runs,
          alignment,
          spacing: { line: defaultStyles.lineHeight * 240 }
        }));
      }
    });

    if (paragraphs.length === 0) {
      return [new Paragraph({
        children: [new TextRun({
          text: ' ',
          font: defaultStyles.font,
          size: defaultStyles.size,
          color: defaultStyles.color
        })]
      })];
    }

    return paragraphs;

  } catch (error) {
    console.error('HTML to DOCX conversion error:', error);
    console.error('Offending content:', html);
    return [new Paragraph({
      text: 'Content formatting error - please check your input',
      color: 'FF0000',
      bold: true
    })];
  }
}

exports.createArticle = async (req, res) => {
  try {
    const { title, content, styles = {}, type = 'html' } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ status: 'fail', message: 'A valid title is required' });
    }

    if (!content) {
      return res.status(400).json({ status: 'fail', message: 'Content is required' });
    }

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
      fontSize: styles.fontSize || '11',
      color: normalizeColor(styles.color),
      lineHeight: styles.lineHeight || 1.5
    };

    let paragraphs = [];

    if (type === 'json' && Array.isArray(content)) {
      paragraphs = jsonToDocxParagraphs(content, {
        font: defaultStyles.fontFamily,
        size: defaultStyles.fontSize * 2,
        color: defaultStyles.color,
        lineHeight: defaultStyles.lineHeight
      });
    } else {
      paragraphs = htmlToDocxParagraphs(typeof content === 'string' ? content : JSON.stringify(content), styles);
    }

    const article = await Article.create({
      title: sanitize(title),
      content: sanitize(typeof content === 'string' ? content : JSON.stringify(content)),
      slug,
      isPublished: true,
      publishedAt: new Date(),
      styles: defaultStyles
    });

    const articleUrl = `${req.protocol}://${req.get('host')}/articles/${article.slug}`;

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
