import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, dayKey } from '../utils.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncRoute(async (req, res) => {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    days.push(d.toISOString().slice(0, 10));
  }
  const habits = db.habits.find({ user: req.user._id, archived: false });
  const completions = db.habitCompletions.find({ user: req.user._id, dayKey: days });
  const countByDay = Object.fromEntries(days.map(d => [d, 0]));
  completions.forEach(c => { countByDay[c.dayKey] = (countByDay[c.dayKey] || 0) + 1; });
  const todayCount = countByDay[dayKey()] || 0;
  res.json({
    totalHabits: habits.length,
    completedToday: todayCount,
    completionRate: habits.length ? Math.round(todayCount / habits.length * 100) : 0,
    totalCompletions: db.habitCompletions.count({ user: req.user._id }),
    weekly: days.map(day => ({ day, completed: countByDay[day] }))
  });
}));
export default router;
