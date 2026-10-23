const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Movie = require('./models/movieModel');

const app = express();
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let dbName = '';
let dbHost = '';
let dbPort = '';

// The lab platform runs MongoDB in a container named "mongo".
// Locally, set MONGO_URL=mongodb://127.0.0.1:27017/libraryDB
mongoose.connect(process.env.MONGO_URL || 'mongodb://mongo:27017/libraryDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Database connected successfully!');
    const db = mongoose.connection;
    dbName = db.name;
    dbHost = db.host;
    dbPort = db.port;
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });

app.get('/ui', (req, res) => {
  res.render('index');
});

// POST /add-movie
app.post('/add-movie', async (req, res) => {
  try {
    const { title, director, year, rating } = req.body;
    const movie = new Movie({ title, director, year, rating });
    await movie.save();
    res.send(`Movie added: ${movie.title}`);
  } catch (err) {
    res.status(500).send('Error adding movie: ' + err.message);
  }
});

// GET /movies
app.get('/movies', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).send('Error retrieving movies: ' + err.message);
  }
});

// PUT /update-movie
app.put('/update-movie', async (req, res) => {
  try {
    const { title, newRating } = req.body;
    const updated = await Movie.findOneAndUpdate(
      { title },
      { $set: { rating: newRating } },
      { new: true }
    );
    if (!updated) {
      return res.send(`No movie found with title '${title}'`);
    }
    res.send(`Movie '${title}' rating updated successfully`);
  } catch (err) {
    res.status(500).send('Error updating movie: ' + err.message);
  }
});

// DELETE /movies/:title
app.delete('/movies/:title', async (req, res) => {
  try {
    const deleted = await Movie.findOneAndDelete({ title: req.params.title });
    if (!deleted) {
      return res.json({ message: "Movie not found" });
    }
    res.json({ message: "Movie deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting movie: ' + err.message });
  }
});

// -------------------- DATABASE DETAILS --------------------
app.get('/', (req, res) => {
  res.json({ dbName, dbHost, dbPort });
});

// -------------------- SERVER --------------------
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
