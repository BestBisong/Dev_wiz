const Layout = require('../models/layout.model');
const { generateHTML, wrapWithHTMLPage } = require('../utils/htmlGenerator');

exports.createLayout = async (req, res) => {
    try {
        const { name, elements } = req.body;

        if (!name || !elements) {
            return res.status(400).json({ message: "Name and elements are required" });
        }

        // Generate HTML from the dropped items structure
        const bodyHTML = generateHTML(elements);
        const fullHTML = wrapWithHTMLPage(bodyHTML);

        // Save to database (optional)
        const newLayout = new Layout({
            name,
            layoutJSON: elements,
            generatedHTML: fullHTML
        });
        await newLayout.save();

        // Set headers for immediate download
        res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/[^a-z0-9]/gi, '_')}.html"`);
        res.setHeader('Content-Type', 'text/html');
        
        // Send the HTML for download
        res.send(fullHTML);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};