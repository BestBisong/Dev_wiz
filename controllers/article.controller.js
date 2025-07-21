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

function safeFontSize(sizePx, fallback = 22) {
  const size = parseFloat(sizePx);
  return isNaN(size) ? fallback : Math.max(8, Math.min(72, size)) * 2;
}

function safeContentToHtml(content) {
  if (typeof content === 'object') {
    return `<pre>${JSON.stringify(content, null, 2)}</pre>`;
  }
  if (typeof content === 'string') {
    return content.trim();
  }
  return '<p>No content provided</p>';
}

function htmlToDocxParagraphs(html, styles = {}) {
  try {
    if (!html || typeof html !== 'string') {
      return [new Paragraph({ text: 'No content available' })];
    }

    html = html.trim();
    const isPlainText = !html.includes('<') && !html.includes('>');

    const defaultStyles = {
      fontFamily: (typeof styles.fontFamily === 'string' && styles.fontFamily.trim()) || 'Calibri',
      fontSize: styles.fontSize ? parseFloat(styles.fontSize) : 11,
      size: safeFontSize(styles.fontSize, 22),
      color: normalizeColor(styles.color),
      lineHeight: styles.lineHeight ? Math.min(3, Math.max(1, parseFloat(styles.lineHeight))) : 1.5
    };

    const createTextRun = (text, node = null, parentStyles = {}) => {
      if (!text || !text.trim()) return null;

      const options = {
        text: text.replace(/\s+/g, ' ').trim(),
        font: parentStyles.fontFamily || defaultStyles.fontFamily,
        size: parentStyles.size || defaultStyles.size,
        color: parentStyles.color || defaultStyles.color
      };

      if (node && node.getAttribute) {
        const style = node.getAttribute('style') || '';

        const colorMatch = style.match(/color:\s*([^;]+)/i);
        if (colorMatch) options.color = normalizeColor(colorMatch[1]);

        const fontMatch = style.match(/font-family:\s*([^;]+)/i);
        if (fontMatch) {
          options.font = fontMatch[1].replace(/['"]/g, '').split(',')[0].trim();
        }

        const sizeMatch = style.match(/font-size:\s*([\d.]+)px/i);
        if (sizeMatch) {
          options.size = safeFontSize(sizeMatch[1], defaultStyles.size);
        }

        if (style.includes('font-weight:bold') || ['B', 'STRONG'].includes(node.tagName)) options.bold = true;
        if (style.includes('font-style:italic') || ['I', 'EM'].includes(node.tagName)) options.italics = true;
        if (style.includes('text-decoration:underline') || node.tagName === 'U') options.underline = {};
      }

      return new TextRun(options);
    };

    if (isPlainText) {
      const lines = html.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      return lines.map(line => new Paragraph({
        children: [new TextRun({
          text: line,
          font: defaultStyles.fontFamily,
          size: defaultStyles.size,
          color: defaultStyles.color
        })],
        spacing: { line: defaultStyles.lineHeight * 240 }
      }));
    }

    const root = parse(html);
    const paragraphs = [];

    root.childNodes.forEach(node => {
      if (node.nodeType === 3) {
        // Text node outside any element
        const textRun = createTextRun(node.textContent, node);
        if (textRun) {
          paragraphs.push(new Paragraph({
            children: [textRun],
            alignment: AlignmentType.LEFT,
            spacing: { line: defaultStyles.lineHeight * 240 }
          }));
        }
      } else if (node.tagName) {
        const style = node.getAttribute('style') || '';
        let alignment = AlignmentType.LEFT;

        if (/text-align:\s*center/i.test(style)) alignment = AlignmentType.CENTER;
        else if (/text-align:\s*right/i.test(style)) alignment = AlignmentType.RIGHT;
        else if (/text-align:\s*justify/i.test(style)) alignment = AlignmentType.JUSTIFIED;

        const children = [];
        node.childNodes.forEach(child => {
          const textRun = createTextRun(child.textContent, child);
          if (textRun) children.push(textRun);
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

    if (paragraphs.length === 0) {
      return [new Paragraph({
        children: [new TextRun({
          text: ' ',
          font: defaultStyles.fontFamily,
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
    const { title, content, styles = {} } = req.body;

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
      fontSize: styles.fontSize || 11,
      size: safeFontSize(styles.fontSize, 22),
      color: normalizeColor(styles.color),
      lineHeight: styles.lineHeight || 1.5
    };

    const safeHtml = safeContentToHtml(content);
    const paragraphs = htmlToDocxParagraphs(safeHtml, styles);

    const article = await Article.create({
      title: sanitize(title),
      content: sanitize(safeHtml),
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
