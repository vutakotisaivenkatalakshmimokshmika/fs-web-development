import { Router } from 'express';
import { Pet, ShopItem, User, RewardTransaction } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute } from '../utils.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncRoute(async (req, res) => {
  let pet = await Pet.findOne({ user: req.user._id }).populate('inventory').populate('equippedItem');
  if (!pet) pet = await Pet.create({ user: req.user._id });
  res.json({ pet, coins: req.user.coins });
}));

router.patch('/', asyncRoute(async (req, res) => {
  const patch = {};
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (name.length < 1 || name.length > 30) return res.status(400).json({ message: 'Pet name must be 1–30 characters.' });
    patch.name = name;
  }
  if (req.body.species !== undefined && ['cat', 'fox', 'bunny'].includes(req.body.species)) patch.species = req.body.species;
  const pet = await Pet.findOneAndUpdate({ user: req.user._id }, { $set: patch }, { new: true, upsert: true }).populate('inventory').populate('equippedItem');
  res.json({ pet });
}));

router.post('/feed', asyncRoute(async (req, res) => {
  const cost = 5;
  const user = await User.findOneAndUpdate({ _id: req.user._id, coins: { $gte: cost } }, { $inc: { coins: -cost } }, { new: true });
  if (!user) return res.status(400).json({ message: 'You need at least 5 coins to feed your pet.' });
  const pet = await Pet.findOne({ user: req.user._id });
  pet.happiness = Math.min(100, pet.happiness + 12);
  pet.energy = Math.min(100, pet.energy + 8);
  await pet.save();
  res.json({ pet, coins: user.coins, message: 'Yum! Your pet is feeling loved.' });
}));

router.post('/equip/:itemId', asyncRoute(async (req, res) => {
  const pet = await Pet.findOne({ user: req.user._id });
  if (!pet || !pet.inventory.some(id => String(id) === req.params.itemId)) return res.status(403).json({ message: 'You do not own this item.' });
  pet.equippedItem = req.params.itemId;
  await pet.save();
  res.json({ pet: await pet.populate(['inventory', 'equippedItem']) });
}));

export default router;
