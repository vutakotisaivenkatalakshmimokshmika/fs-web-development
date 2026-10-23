import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  coins: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

const habitSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 240 },
  category: { type: String, enum: ['Study', 'Health', 'Productivity', 'Self-care', 'Other'], default: 'Other' },
  targetMinutes: { type: Number, default: 0, min: 0, max: 1440 },
  archived: { type: Boolean, default: false }
}, { timestamps: true });

const completionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  habit: { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
  dayKey: { type: String, required: true },
  rewardCoins: { type: Number, default: 10 },
  rewardXp: { type: Number, default: 5 }
}, { timestamps: true });
completionSchema.index({ user: 1, habit: 1, dayKey: 1 }, { unique: true });

const petSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  species: { type: String, enum: ['cat', 'fox', 'bunny'], default: 'cat' },
  name: { type: String, default: 'Mochi', trim: true, maxlength: 30 },
  happiness: { type: Number, default: 75, min: 0, max: 100 },
  energy: { type: Number, default: 80, min: 0, max: 100 },
  xp: { type: Number, default: 0, min: 0 },
  level: { type: Number, default: 1, min: 1 },
  inventory: [{ type: Schema.Types.ObjectId, ref: 'ShopItem' }],
  equippedItem: { type: Schema.Types.ObjectId, ref: 'ShopItem', default: null }
}, { timestamps: true });

const shopItemSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['food', 'toy', 'accessory'], default: 'toy' },
  price: { type: Number, required: true, min: 1 },
  emoji: { type: String, default: '🎁' }
}, { timestamps: true });

const transactionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  item: { type: Schema.Types.ObjectId, ref: 'ShopItem', required: true },
  type: { type: String, enum: ['purchase', 'feed'], required: true },
  coins: { type: Number, required: true }
}, { timestamps: true });

export const User = model('User', userSchema);
export const Habit = model('Habit', habitSchema);
export const HabitCompletion = model('HabitCompletion', completionSchema);
export const Pet = model('Pet', petSchema);
export const ShopItem = model('ShopItem', shopItemSchema);
export const RewardTransaction = model('RewardTransaction', transactionSchema);
