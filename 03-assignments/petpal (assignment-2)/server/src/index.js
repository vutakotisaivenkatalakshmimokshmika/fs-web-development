import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import habitRoutes from './routes/habits.js';
import petRoutes from './routes/pet.js';
import shopRoutes from './routes/shop.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'PetPal API' }));
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/pet', petRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found.' }));

// Front-end: plain HTML/CSS/JS served from server/public.
// Any non-API page (/, /habits, /shop, ...) returns index.html and the browser-side router takes over.
const publicDir = fileURLToPath(new URL('../public', import.meta.url));
app.use(express.static(publicDir));
app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong.' });
});

const port = process.env.PORT || 5000;
try {
  const file = initDatabase();
  console.log(`Using local JSON database: ${file}`);
  app.listen(port, () => console.log(`PetPal running at http://localhost:${port}`));
} catch (err) {
  console.error('Could not open the local JSON database:', err.message);
  process.exit(1);
}
