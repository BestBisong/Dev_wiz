const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  layout: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Layout',
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  metaTitle: String,
  metaDescription: String,
  keywords: [String],
  ogImage: String
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);
