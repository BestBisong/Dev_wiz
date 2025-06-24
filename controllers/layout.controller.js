    const Layout = require('../models/layout.model');
    const { generateHTML, wrapWithHTMLPage } = require('../utils/htmlGenerator');
    const archiver = require('archiver');
    const stream = require('stream');
    exports.createLayout = async (req, res) => {
    try {
        const { name, layout, css } = req.body;

        if (!name || !layout) {
        return res.status(400).json({ message: "Name and layout are required" });
        }

        const bodyHTML = generateHTML(layout);
        const fullHTML = wrapWithHTMLPage(bodyHTML, css );

        const newLayout = new Layout({
        name,
        layoutJSON: layout,
        customCSS: css || "",
        generatedHTML: fullHTML
        });

        await newLayout.save();
        res.status(201).json({
        message: "Layout saved successfully",
        html: fullHTML
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
    };

    exports.getLayouts = async (req, res) => {
    try {
        const layouts = await Layout.find().sort({ createdAt: -1 });
        res.json(layouts);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
    };

exports.getLayoutById = async (req, res) => {
    try {
        const layout = await Layout.findById(req.params.id);
        if (!layout) return res.status(404).json({ message: "Layout not found" });
        res.json(layout);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};  // This closing brace was missing

exports.previewLayout = async (req, res) => {
    try {
        const layout = await Layout.findById(req.params.id);
        if (!layout) return res.status(404).send('Layout not found');

        res.set('Content-Type', 'text/html');
        res.send(layout.generatedHTML);
    } catch (error) {
        res.status(500).send('Server error');
    }
};

exports.downloadHTML = async (req, res) => {
    try {
        const layout = await Layout.findById(req.params.id);
        if (!layout) return res.status(404).send('Layout not found');

        res.setHeader('Content-Disposition', `attachment; filename="${layout.name}.html"`);
        res.setHeader('Content-Type', 'text/html');
        res.send(layout.generatedHTML);
    } catch (error) {
        res.status(500).send('Server error');
    }
};

exports.downloadZip = async (req, res) => {
    try {
        const layout = await Layout.findById(req.params.id);
        if (!layout) return res.status(404).send('Layout not found');

        const archive = archiver('zip');
        res.attachment(`${layout.name}.zip`);

        archive.pipe(res);
        archive.append(layout.generatedHTML, { name: 'index.html' });
        archive.append(layout.customCSS, { name: 'style.css' });
        await archive.finalize();
    } catch (err) {
        res.status(500).send('Zip export failed');
    }
};