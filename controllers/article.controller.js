// article.controller.js
const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } = require("docx");
const { parse } = require("node-html-parser");
const slugify = require("slugify");
const Article = require("../models/article.model");
const { sanitize } = require("../utils/sanitizer");

function normalizeColor(color) {
  if (!color || typeof color !== "string") return "000000";
  color = color.trim().toLowerCase();

  const hexMatch = color.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    return hex.length === 3 ? hex.split("").map(c => c + c).join("").toUpperCase() : hex.toUpperCase();
  }

  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
      .map(n => Math.min(255, Math.max(0, parseInt(n))).toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  return "000000";
}

function safeFontSize(sizePx, fallback = 22) {
  const size = parseFloat(sizePx);
  return isNaN(size) ? fallback : Math.max(8, Math.min(72, size)) * 2;
}

// Recursive function to convert HTML to docx Paragraphs
function htmlToDocxParagraphs(html, styles = {}) {
  const root = parse(html);

  const defaultStyles = {
    fontFamily: styles.fontFamily || "Calibri",
    size: safeFontSize(styles.fontSize, 22),
    color: normalizeColor(styles.color),
    lineHeight: styles.lineHeight ? parseFloat(styles.lineHeight) : 1.5
  };

  const parseNode = (node, parentStyles = {}) => {
    const currentStyles = { ...parentStyles };

    if (node.nodeType === 3) { // Text
      const text = node.textContent.replace(/\s+/g, " ").trim();
      if (!text) return [];

      return [new TextRun({
        text,
        font: currentStyles.fontFamily || defaultStyles.fontFamily,
        size: currentStyles.size || defaultStyles.size,
        color: currentStyles.color || defaultStyles.color,
        bold: currentStyles.bold || false,
        italics: currentStyles.italics || false,
        underline: currentStyles.underline || undefined
      })];
    }

    if (node.nodeType === 1) { // Element
      const style = node.getAttribute("style") || "";

      const colorMatch = style.match(/color:\s*([^;]+)/i);
      if (colorMatch) currentStyles.color = normalizeColor(colorMatch[1]);

      const fontMatch = style.match(/font-family:\s*([^;]+)/i);
      if (fontMatch) currentStyles.fontFamily = fontMatch[1].replace(/['"]/g, "").split(",")[0].trim();

      const sizeMatch = style.match(/font-size:\s*([\d.]+)px/i);
      if (sizeMatch) currentStyles.size = safeFontSize(sizeMatch[1]);

      if (style.includes("font-weight:bold") || ["B", "STRONG"].includes(node.tagName)) currentStyles.bold = true;
      if (style.includes("font-style:italic") || ["I", "EM"].includes(node.tagName)) currentStyles.italics = true;
      if (style.includes("text-decoration:underline") || node.tagName === "U") currentStyles.underline = {};

      if (node.tagName === "BR") {
        return [new TextRun({ text: "\n" })];
      }

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
    const style = node.getAttribute ? node.getAttribute("style") || "" : "";
    let alignment = AlignmentType.LEFT;

    if (/text-align:\s*center/i.test(style)) alignment = AlignmentType.CENTER;
    else if (/text-align:\s*right/i.test(style)) alignment = AlignmentType.RIGHT;
    else if (/text-align:\s*justify/i.test(style)) alignment = AlignmentType.JUSTIFIED;

    const runs = parseNode(node);

    if (runs.length > 0) {
      paragraphs.push(new Paragraph({
        children: runs,
        alignment,
        spacing: { line: defaultStyles.lineHeight * 240 }
      }));
    }
  });

  if (paragraphs.length === 0) {
    return [new Paragraph({ text: "No content" })];
  }

  return paragraphs;
}

// Main article creation function
exports.createArticle = async (req, res) => {
  try {
    const { title, content, styles = {} } = req.body;

    if (!title || !content) {
      return res.status(400).json({ status: "fail", message: "Title and content required" });
    }

    let slug = slugify(title, { lower: true, strict: true }).substring(0, 100);
    while (await Article.findOne({ slug })) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const paragraphs = htmlToDocxParagraphs(content, styles);

    await Article.create({
      title: sanitize(title),
      content: sanitize(content),
      slug,
      isPublished: true,
      publishedAt: new Date(),
      styles
    });

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          ...paragraphs
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slug}.docx"`
    });

    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Failed to create document" });
  }
};
