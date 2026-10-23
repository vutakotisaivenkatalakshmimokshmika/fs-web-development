const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  director: String,
  year: Number,
  rating: Number
});

module.exports = mongoose.model('Movie', movieSchema);
