const Article = require('../models/article.model');
const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } = require("docx");
const { parse } = require('node-html-parser');
const slugify = require('slugify');
const { sanitize } = require('../utils/sanitizer');

// Extended color palette mapping
const COLOR_PALETTE = {
  '000000': 'Black',
  'FFFFFF': 'White',
  'FF0000': 'Red',
  '00FF00': 'Green',
  '0000FF': 'Blue',
  'FFFF00': 'Yellow',
  'FF00FF': 'Magenta',
  '00FFFF': 'Cyan',
  '800000': 'Maroon',
  '008000': 'DarkGreen',
  '000080': 'Navy',
  '808000': 'Olive',
  '800080': 'Purple',
  '008080': 'Teal',
  'C0C0C0': 'Silver',
  '808080': 'Gray'
};

/**
 * Normalize color to hex format
 * @param {string} color - Input color string
 * @returns {string} Normalized 6-digit hex color (without #)
 */
function normalizeColor(color) {
  if (!color || typeof color !== 'string') return '000000';
  
  // Remove whitespace and make lowercase
  color = color.trim().toLowerCase();
  
  // Handle hex colors (#fff or #ffffff)
  const hexMatch = color.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    return hex.length === 3 ? 
      hex.split('').map(c => c + c).join('').toUpperCase() : 
      hex.toUpperCase();
  }

  // Handle named colors
  const paletteEntry = Object.entries(COLOR_PALETTE).find(
    ([hex, name]) => name.toLowerCase() === color
  );
  if (paletteEntry) return paletteEntry[0];

  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
      .map(n => Math.min(255, Math.max(0, parseInt(n))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  // Default to black if color is invalid
  return '000000';
}

/**
 * Convert HTML to DOCX paragraphs with proper styling
 * @param {string} html - HTML content to convert
 * @param {object} styles - Base styles to apply
 * @returns {Array} Array of docx Paragraph objects
 */
function htmlToDocxParagraphs(html, styles = {}) {
  try {
    // Validate input
    if (!html || typeof html !== 'string') {
      return [new Paragraph({ text: 'No content available' })];
    }

    html = html.trim();
    if (!html) return [new Paragraph({ text: '' })];

    const root = parse(html);
    const paragraphs = [];
    
    // Set default styles with validation
    const defaultStyles = {
      fontFamily: (typeof styles.fontFamily === 'string' && styles.fontFamily.trim()) || 'Calibri',
      fontSize: styles.fontSize ? 
        Math.max(8, Math.min(72, parseInt(styles.fontSize))) * 2 : 22, // 11pt default
      color: normalizeColor(styles.color),
      lineHeight: styles.lineHeight ? 
        Math.min(3, Math.max(1, parseFloat(styles.lineHeight))) : 1.5
    };

    /**
     * Create a TextRun with proper styling
     * @param {string} text - Text content
     * @param {object} node - HTML node
     * @param {object} parentStyles - Inherited styles
     * @returns {TextRun|null} TextRun instance or null if empty
     */
    const createTextRun = (text, node = null, parentStyles = {}) => {
      if (!text || !text.trim()) return null;
      
      const options = {
        text: text.replace(/\s+/g, ' ').trim(), // Collapse whitespace
        font: parentStyles.fontFamily || defaultStyles.fontFamily,
        size: parentStyles.fontSize || defaultStyles.fontSize,
        color: parentStyles.color || defaultStyles.color
      };

      // Apply inline styles if node exists
      if (node && node.getAttribute) {
        const style = node.getAttribute('style') || '';
        
        // Color
        const colorMatch = style.match(/color:\s*([^;]+)/i);
        if (colorMatch) options.color = normalizeColor(colorMatch[1]);

        // Font family
        const fontMatch = style.match(/font-family:\s*([^;]+)/i);
        if (fontMatch) {
          options.font = fontMatch[1]
            .replace(/['"]/g, '')
            .split(',')[0] // Take first font in list
            .trim();
        }

        // Font size
        const sizeMatch = style.match(/font-size:\s*(\d+)px/i);
        if (sizeMatch) {
          options.size = Math.max(8, Math.min(72, parseInt(sizeMatch[1]))) * 2;
        }

        // Text decoration
        if (['STRONG', 'B'].includes(node.tagName)) options.bold = true;
        if (['EM', 'I'].includes(node.tagName)) options.italics = true;
        if (node.tagName === 'U' || style.includes('text-decoration:underline')) {
          options.underline = {};
        }
      }

      return new TextRun(options);
    };

    // Process each node in the HTML
    root.childNodes.forEach((node) => {
      // Text nodes
      if (node.nodeType === 3) {
        const textRun = createTextRun(node.textContent, node);
        if (textRun) {
          paragraphs.push(new Paragraph({
            children: [textRun],
            spacing: { line: defaultStyles.lineHeight * 240 }
          }));
        }
      }
      // Element nodes
      else if (node.tagName) {
        const tag = node.tagName.toUpperCase();
        const children = [];
        let alignment = AlignmentType.LEFT;
        const style = node.getAttribute('style') || '';

        // Determine alignment
        if (style.includes('text-align:center')) alignment = AlignmentType.CENTER;
        else if (style.includes('text-align:right')) alignment = AlignmentType.RIGHT;
        else if (style.includes('text-align:justify')) alignment = AlignmentType.JUSTIFIED;

        // Process child nodes
        node.childNodes.forEach((child) => {
          if (child.nodeType === 3) {
            const textRun = createTextRun(child.textContent, child);
            if (textRun) children.push(textRun);
          } else if (child.tagName) {
            const textRun = createTextRun(child.textContent, child);
            if (textRun) children.push(textRun);
          }
        });

        // Create paragraph if there's content or it's a paragraph/div tag
        if (children.length > 0 || ['P', 'DIV'].includes(tag)) {
          const paragraphOptions = {
            children,
            alignment,
            spacing: { 
              line: defaultStyles.lineHeight * 240,
              before: ['H1', 'H2', 'H3'].includes(tag) ? 200 : 0,
              after: ['H1', 'H2', 'H3'].includes(tag) ? 200 : 0
            }
          };

          // Add heading levels
          if (tag === 'H1') paragraphOptions.heading = HeadingLevel.HEADING_1;
          if (tag === 'H2') paragraphOptions.heading = HeadingLevel.HEADING_2;
          if (tag === 'H3') paragraphOptions.heading = HeadingLevel.HEADING_3;

          paragraphs.push(new Paragraph(paragraphOptions));
        }
      }
    });

    // Ensure we always return at least one paragraph
    return paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: '' })];

  } catch (error) {
    console.error('HTML to DOCX conversion error:', error);
    return [new Paragraph({ 
      text: 'Content formatting error - please check your input',
      color: 'FF0000',
      bold: true
    })];
  }
}

/**
 * Create an article and generate a DOCX download
 */
exports.createArticle = async (req, res) => {
  try {
    // Validate request
    const { title, content, styles = {} } = req.body;
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'A valid title is required'
      });
    }
    
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid content is required'
      });
    }

    // Generate unique slug
    let slug = slugify(title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    }).substring(0, 100); // Limit slug length
    
    let attempts = 0;
    while (attempts < 5) {
      const exists = await Article.findOne({ slug }).lean();
      if (!exists) break;
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
      attempts++;
    }

    // Create article in database
    const article = await Article.create({
      title: sanitize(title),
      content: sanitize(content),
      slug,
      isPublished: true,
      publishedAt: new Date(),
      styles: {
        fontFamily: styles.fontFamily || 'Calibri',
        fontSize: styles.fontSize || '11',
        color: normalizeColor(styles.color),
        lineHeight: styles.lineHeight || 1.5
      }
    });

    const articleUrl = `${req.protocol}://${req.get('host')}/articles/${article.slug}`;

    // Create DOCX document
    const doc = new Document({
      title: sanitize(title),
      description: `Article: ${sanitize(title)}`,
      creator: 'Your Application Name',
      styles: {
        paragraphStyles: [{
          id: 'Normal',
          name: 'Normal',
          run: {
            font: 'Calibri',
            size: 24, // 12pt
          },
          paragraph: {
            spacing: { line: 276 }, // 1.15 line spacing
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
            spacing: { after: 400, before: 400 }
          }),
          ...htmlToDocxParagraphs(content, styles),
          new Paragraph({
            text: `Read online: ${articleUrl}`,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            style: 'Normal'
          })
        ]
      }]
    });

    // Generate document buffer
    const buffer = await Packer.toBuffer(doc);
    if (!buffer || buffer.length === 0) {
      throw new Error('Failed to generate document buffer');
    }

    // Send response
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
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};