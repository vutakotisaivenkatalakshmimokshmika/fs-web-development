import { Router } from 'express';
import { db, isValidId } from '../db.js';
import { HABIT_CATEGORIES, createHabit, clampStat } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, dayKey } from '../utils.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncRoute(async (req, res) => {
  const habits = db.habits.find({ user: req.user._id, archived: false })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const completions = db.habitCompletions.find({ user: req.user._id, dayKey: dayKey() });
  const done = new Set(completions.map(c => String(c.habit)));
  res.json({ habits: habits.map(h => ({ ...h, completedToday: done.has(String(h._id)) })) });
}));

router.post('/', asyncRoute(async (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) return res.status(400).json({ message: 'Habit title is required.' });
  const habit = createHabit(req.user._id, {
    title,
    description: req.body.description,
    category: req.body.category,
    targetMinutes: req.body.targetMinutes
  });
  res.status(201).json({ habit: { ...habit, completedToday: false } });
}));

router.patch('/:id', asyncRoute(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid habit ID.' });
  const query = { _id: req.params.id, user: req.user._id, archived: false };
  const habit = db.habits.findOne(query);
  if (!habit) return res.status(404).json({ message: 'Habit not found.' });
  const patch = {};
  if (req.body.title !== undefined) patch.title = String(req.body.title).trim().slice(0, 100) || habit.title;
  if (req.body.description !== undefined) patch.description = String(req.body.description).slice(0, 240);
  if (req.body.category !== undefined && HABIT_CATEGORIES.includes(req.body.category)) patch.category = req.body.category;
  if (req.body.targetMinutes !== undefined) patch.targetMinutes = Math.max(0, Math.min(1440, Number(req.body.targetMinutes) || 0));
  res.json({ habit: db.habits.updateOne(query, patch) });
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  const habit = db.habits.updateOne({ _id: req.params.id, user: req.user._id }, { archived: true });
  if (!habit) return res.status(404).json({ message: 'Habit not found.' });
  res.json({ message: 'Habit archived.' });
}));

router.post('/:id/complete', asyncRoute(async (req, res) => {
  const habit = db.habits.findOne({ _id: req.params.id, user: req.user._id, archived: false });
  if (!habit) return res.status(404).json({ message: 'Habit not found.' });
  const key = dayKey();
  // The check and insert run synchronously, so two simultaneous requests cannot both earn a reward.
  const existing = db.habitCompletions.findOne({ user: req.user._id, habit: habit._id, dayKey: key });
  if (existing) return res.status(409).json({ message: 'You have already earned a reward for this habit today.' });
  const completion = db.habitCompletions.insert({ user: req.user._id, habit: habit._id, dayKey: key, rewardCoins: 10, rewardXp: 5 });
  const user = db.users.updateById(req.user._id, (u) => ({ coins: (u.coins || 0) + 10 }));
  const pet = db.pets.updateOne({ user: req.user._id }, (p) => {
    const xp = p.xp + 5;
    return {
      xp,
      level: Math.floor(xp / 50) + 1,
      happiness: clampStat(p.happiness + 5),
      energy: clampStat(p.energy + 1)
    };
  });
  res.status(201).json({ completion, coins: user.coins, pet, message: 'Habit completed! You earned 10 coins and 5 XP.' });
}));

export default router;
