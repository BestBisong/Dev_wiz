const mongoose = require('mongoose');

const layoutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  layoutJSON: {
    type: Object,
    required: true
  },
  generatedHTML: {
    type: String,
    required: true
  },
  generatedCSS: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Layout', layoutSchema);