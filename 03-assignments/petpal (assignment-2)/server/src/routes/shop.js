import { Router } from 'express';
import { db, isValidId } from '../db.js';
import { populatePet, clampStat } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute } from '../utils.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncRoute(async (_req, res) => res.json({ items: db.shopItems.find().sort((a, b) => a.price - b.price) })));

router.post('/buy/:itemId', asyncRoute(async (req, res) => {
  if (!isValidId(req.params.itemId)) return res.status(400).json({ message: 'Invalid item.' });
  const item = db.shopItems.findById(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Shop item not found.' });
  const pet = db.pets.findOne({ user: req.user._id });
  if (!pet) return res.status(404).json({ message: 'Adopt a pet first.' });
  const consumable = item.category === 'food';
  if (!consumable && pet.inventory.some(id => String(id) === String(item._id))) return res.status(409).json({ message: 'You already own this item.' });
  // Balance check and decrement happen synchronously, so coins can never go negative.
  const current = db.users.findById(req.user._id);
  if (!current || current.coins < item.price) return res.status(400).json({ message: 'Not enough coins yet. Complete a few habits first!' });
  const user = db.users.updateById(req.user._id, { coins: current.coins - item.price });
  const updatedPet = db.pets.updateOne({ user: req.user._id }, (p) => consumable
    ? { happiness: clampStat(p.happiness + 10), energy: clampStat(p.energy + 6) }
    : {
        inventory: [...p.inventory, item._id],
        equippedItem: item.category === 'accessory' ? item._id : p.equippedItem
      });
  db.rewardTransactions.insert({ user: req.user._id, item: item._id, type: 'purchase', coins: -item.price });
  res.status(201).json({ item, coins: user.coins, pet: populatePet(updatedPet), message: consumable ? `${item.name} purchased! Your pet enjoyed the treat.` : `${item.name} added to your inventory!` });
}));

export default router;
