import { Router } from 'express';
import mongoose from 'mongoose';
import { Habit, HabitCompletion, User, Pet } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, dayKey } from '../utils.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncRoute(async (req, res) => {
  const habits = await Habit.find({ user: req.user._id, archived: false }).sort({ createdAt: 1 });
  const completions = await HabitCompletion.find({ user: req.user._id, dayKey: dayKey() });
  const done = new Set(completions.map(c => String(c.habit)));
  res.json({ habits: habits.map(h => ({ ...h.toObject(), completedToday: done.has(String(h._id)) })) });
}));

router.post('/', asyncRoute(async (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) return res.status(400).json({ message: 'Habit title is required.' });
  const allowed = ['Study', 'Health', 'Productivity', 'Self-care', 'Other'];
  const habit = await Habit.create({
    user: req.user._id, title,
    description: String(req.body.description || '').slice(0, 240),
    category: allowed.includes(req.body.category) ? req.body.category : 'Other',
    targetMinutes: Math.max(0, Math.min(1440, Number(req.body.targetMinutes) || 0))
  });
  res.status(201).json({ habit: { ...habit.toObject(), completedToday: false } });
}));

router.patch('/:id', asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid habit ID.' });
  const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id, archived: false });
  if (!habit) return res.status(404).json({ message: 'Habit not found.' });
  if (req.body.title !== undefined) habit.title = String(req.body.title).trim().slice(0, 100) || habit.title;
  if (req.body.description !== undefined) habit.description = String(req.body.description).slice(0, 240);
  if (req.body.category !== undefined && ['Study','Health','Productivity','Self-care','Other'].includes(req.body.category)) habit.category = req.body.category;
  await habit.save();
  res.json({ habit });
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  const habit = await Habit.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { archived: true }, { new: true });
  if (!habit) return res.status(404).json({ message: 'Habit not found.' });
  res.json({ message: 'Habit archived.' });
}));

router.post('/:id/complete', asyncRoute(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id, archived: false });
  if (!habit) return res.status(404).json({ message: 'Habit not found.' });
  const key = dayKey();
  const existing = await HabitCompletion.findOne({ user: req.user._id, habit: habit._id, dayKey: key });
  if (existing) return res.status(409).json({ message: 'You have already earned a reward for this habit today.' });
  // Insert first; the unique index also prevents duplicate rewards during simultaneous requests.
  let completion;
  try {
    completion = await HabitCompletion.create({ user: req.user._id, habit: habit._id, dayKey: key, rewardCoins: 10, rewardXp: 5 });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'This habit is already completed today.' });
    throw e;
  }
  const user = await User.findByIdAndUpdate(req.user._id, { $inc: { coins: 10 } }, { new: true });
  const pet = await Pet.findOne({ user: req.user._id });
  if (pet) {
    pet.xp += 5;
    pet.level = Math.floor(pet.xp / 50) + 1;
    pet.happiness = Math.min(100, pet.happiness + 5);
    pet.energy = Math.min(100, pet.energy + 1);
    await pet.save();
  }
  res.status(201).json({ completion, coins: user.coins, pet, message: 'Habit completed! You earned 10 coins and 5 XP.' });
}));

export default router;
