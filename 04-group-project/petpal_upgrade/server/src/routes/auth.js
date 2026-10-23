import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Pet, Habit } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute } from '../utils.js';

const router = Router();
const signToken = (user) => jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'development_only_change_me', { expiresIn: '7d' });

router.post('/register', asyncRoute(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2) return res.status(400).json({ message: 'Name must contain at least 2 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  await Pet.create({ user: user._id, name: 'Mochi', species: 'cat' });
  await Habit.insertMany([
    { user: user._id, title: 'Study for 30 minutes', category: 'Study', targetMinutes: 30 },
    { user: user._id, title: 'Take a water break', category: 'Health' },
    { user: user._id, title: 'Plan tomorrow', category: 'Productivity' }
  ]);
  res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, coins: user.coins } });
}));

router.post('/login', asyncRoute(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Incorrect email or password.' });
  res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, coins: user.coins } });
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, coins: req.user.coins } }));
export default router;
