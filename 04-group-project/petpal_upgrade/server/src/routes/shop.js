import { Router } from 'express';
import mongoose from 'mongoose';
import { ShopItem, User, Pet, RewardTransaction } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute } from '../utils.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncRoute(async (_req, res) => res.json({ items: await ShopItem.find().sort({ price: 1 }) })));

router.post('/buy/:itemId', asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.itemId)) return res.status(400).json({ message: 'Invalid item.' });
  const item = await ShopItem.findById(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Shop item not found.' });
  const pet = await Pet.findOne({ user: req.user._id });
  if (!pet) return res.status(404).json({ message: 'Adopt a pet first.' });
  const consumable = item.category === 'food';
  if (!consumable && pet.inventory.some(id => String(id) === String(item._id))) return res.status(409).json({ message: 'You already own this item.' });
  // Atomic balance decrement avoids spending more coins than the user has.
  const user = await User.findOneAndUpdate({ _id: req.user._id, coins: { $gte: item.price } }, { $inc: { coins: -item.price } }, { new: true });
  if (!user) return res.status(400).json({ message: 'Not enough coins yet. Complete a few habits first!' });
  if (consumable) {
    pet.happiness = Math.min(100, pet.happiness + 10);
    pet.energy = Math.min(100, pet.energy + 6);
  } else {
    pet.inventory.push(item._id);
    if (item.category === 'accessory') pet.equippedItem = item._id;
  }
  await pet.save();
  await RewardTransaction.create({ user: req.user._id, item: item._id, type: 'purchase', coins: -item.price });
  res.status(201).json({ item, coins: user.coins, pet: await pet.populate(['inventory', 'equippedItem']), message: consumable ? `${item.name} purchased! Your pet enjoyed the treat.` : `${item.name} added to your inventory!` });
}));

export default router;
