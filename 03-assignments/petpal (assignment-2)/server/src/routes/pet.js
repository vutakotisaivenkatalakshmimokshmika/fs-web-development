import { Router } from 'express';
import { db } from '../db.js';
import { PET_SPECIES, getOrCreatePet, populatePet, clampStat } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute } from '../utils.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncRoute(async (req, res) => {
  const pet = getOrCreatePet(req.user._id);
  res.json({ pet: populatePet(pet), coins: req.user.coins });
}));

router.patch('/', asyncRoute(async (req, res) => {
  const patch = {};
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (name.length < 1 || name.length > 30) return res.status(400).json({ message: 'Pet name must be 1–30 characters.' });
    patch.name = name;
  }
  if (req.body.species !== undefined && PET_SPECIES.includes(req.body.species)) patch.species = req.body.species;
  getOrCreatePet(req.user._id);
  const pet = db.pets.updateOne({ user: req.user._id }, patch);
  res.json({ pet: populatePet(pet) });
}));

router.post('/feed', asyncRoute(async (req, res) => {
  const cost = 5;
  const current = db.users.findById(req.user._id);
  if (!current || current.coins < cost) return res.status(400).json({ message: 'You need at least 5 coins to feed your pet.' });
  const user = db.users.updateById(req.user._id, { coins: current.coins - cost });
  getOrCreatePet(req.user._id);
  const pet = db.pets.updateOne({ user: req.user._id }, (p) => ({
    happiness: clampStat(p.happiness + 12),
    energy: clampStat(p.energy + 8)
  }));
  res.json({ pet: populatePet(pet), coins: user.coins, message: 'Yum! Your pet is feeling loved.' });
}));

router.post('/equip/:itemId', asyncRoute(async (req, res) => {
  const pet = db.pets.findOne({ user: req.user._id });
  if (!pet || !pet.inventory.some(id => String(id) === req.params.itemId)) return res.status(403).json({ message: 'You do not own this item.' });
  const updated = db.pets.updateOne({ user: req.user._id }, { equippedItem: req.params.itemId });
  res.json({ pet: populatePet(updated) });
}));

export default router;
