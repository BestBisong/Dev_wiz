const mongoose = require('mongoose');

const LayoutSchema = new mongoose.Schema({
  name: { type: String, required: true },
  layoutJSON: { type: Object, required: true },
  customCSS: { type: String, default: "" },
  generatedHTML: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Layout', LayoutSchema);
