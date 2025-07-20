const Article = require('../models/article.model');
const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } = require("docx");
const { parse } = require('node-html-parser');
const slugify = require('slugify');
const { sanitize } = require('../utils/sanitizer');

// Color palette mapping from your screenshot
const COLOR_PALETTE = {
  // First row (0 • 0 •)
  '000000': 'Black',
  'FFFFFF': 'White',
  'FF0000': 'Red',
  '00FF00': 'Green',
  
  // Second row (• • • •)
  '0000FF': 'Blue',
  'FFFF00': 'Yellow',
  'FF00FF': 'Magenta',
  '00FFFF': 'Cyan'
};

// Enhanced color normalization with palette support
function normalizeColor(color) {
  if (!color) return '000000'; // Default to black
  
  // Check if it's already a valid 3/6 digit hex
  const hexMatch = color.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    return hex.length === 3 ? 
      hex.split('').map(c => c + c).join('').toUpperCase() : 
      hex.toUpperCase();
  }
  
  // Check if it's a named color from our palette
  const paletteColor = Object.entries(COLOR_PALETTE).find(
    ([hex, name]) => name.toLowerCase() === color.toLowerCase()
  );
  if (paletteColor) return paletteColor[0];
  
  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
      .map(n => parseInt(n).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }
  
  return '000000'; // Fallback to black
}

// Enhanced HTML to DOCX converter with palette support
function htmlToDocxParagraphs(html, styles = {}) {
  try {
    if (!html) return [new Paragraph({ text: '' })];

    const root = parse(html);
    const paragraphs = [];
    const defaultStyles = {
      fontFamily: styles.fontFamily || 'Calibri',
      fontSize: styles.fontSize || '22pt',
      color: normalizeColor(styles.color),
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
      } else if (node.tagName && ['P', 'DIV', 'H1', 'H2', 'H3'].includes(node.tagName)) {
        const children = [];
        let alignment = AlignmentType.LEFT;
        const style = node.getAttribute('style') || '';

        // Handle alignment
        if (style.includes('text-align:center')) alignment = AlignmentType.CENTER;
        else if (style.includes('text-align:right')) alignment = AlignmentType.RIGHT;
        else if (style.includes('text-align:justify')) alignment = AlignmentType.JUSTIFIED;

        // Process child nodes with palette support
        node.childNodes.forEach((child) => {
          if (child.nodeType === 3) {
            if (child.textContent.trim()) {
              children.push(new TextRun({
                text: child.textContent,
                font: defaultStyles.fontFamily,
                size: defaultStyles.fontSize,
                color: defaultStyles.color
              }));
            }
          } else if (child.tagName) {
            const textRunOptions = {
              text: child.textContent,
              font: defaultStyles.fontFamily,
              size: defaultStyles.fontSize,
              color: defaultStyles.color
            };

            // Handle inline styles with palette colors
            if (child.getAttribute('style')) {
              const childStyle = child.getAttribute('style');
              if (childStyle.includes('color:')) {
                const colorMatch = childStyle.match(/color:\s*(#[0-9a-f]+|rgb\([^)]+\)|rgba\([^)]+\)|\w+)/i);
                if (colorMatch) {
                  textRunOptions.color = normalizeColor(colorMatch[1]);
                }
              }
            }

            if (['STRONG', 'B'].includes(child.tagName)) textRunOptions.bold = true;
            if (['EM', 'I'].includes(child.tagName)) textRunOptions.italics = true;
            if (child.tagName === 'U') textRunOptions.underline = {};

            children.push(new TextRun(textRunOptions));
          }
        });

        if (children.length > 0 || node.tagName === 'P') {
          paragraphs.push(new Paragraph({
            children,
            alignment,
            spacing: { line: defaultStyles.lineHeight * 240 },
            ...(node.tagName === 'H1' && { heading: HeadingLevel.HEADING_1 }),
            ...(node.tagName === 'H2' && { heading: HeadingLevel.HEADING_2 }),
            ...(node.tagName === 'H3' && { heading: HeadingLevel.HEADING_3 })
          }));
        }
      }
    });

    return paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: '' })];
  } catch (error) {
    console.error('HTML parsing error:', error);
    return [new Paragraph({ text: 'Content formatting error' })];
  }
}

// Create and publish article (rest remains the same)
exports.createArticle = async (req, res) => {
  try {
    const { title, content, styles } = req.body;
    if (!title || !content) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Title and content are required' 
      });
    }

    // Generate unique slug
    let slug = slugify(title, { lower: true, strict: true });
    let attempts = 0;
    while (attempts < 5) {
      const exists = await Article.findOne({ slug }).lean();
      if (!exists) break;
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
      attempts++;
    }

    // Create article
    const article = await Article.create({
      title: sanitize(title),
      content: sanitize(content),
      slug,
      isPublished: true,
      publishedAt: new Date(),
      styles: {
        ...styles,
        color: normalizeColor(styles?.color) // Ensure color is in palette
      }
    });

    const articleUrl = `${req.protocol}://${req.get('host')}/articles/${article.slug}`;

    // Generate DOCX with palette colors
    const doc = new Document({
      styles: {
        paragraphStyles: [{
          id: "Normal",
          name: "Normal",
          run: {
            font: styles?.fontFamily || "Calibri",
            size: styles?.fontSize || "24pt",
            color: normalizeColor(styles?.color) // Use normalized color
          },
          paragraph: {
            spacing: { line: (styles?.lineHeight || 1.5) * 240 }
          }
        }]
      },
      sections: [{
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          ...htmlToDocxParagraphs(content, {
            ...styles,
            color: normalizeColor(styles?.color) // Pass normalized color
          }),
          new Paragraph({
            text: `Read online: ${articleUrl}`,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 }
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    res.status(201).json({
      status: 'success',
      data: {
        download: buffer.toString('base64'),
        articleUrl,
        articleId: article._id,
        colorPalette: COLOR_PALETTE // Return available colors
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};