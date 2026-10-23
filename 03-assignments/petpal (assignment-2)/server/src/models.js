// Data model helpers for the local JSON database (see db.js).
// These replace the former Mongoose schemas: they apply the same defaults
// and limits before documents are stored in data.json.
import { db } from './db.js';

export const HABIT_CATEGORIES = ['Study', 'Health', 'Productivity', 'Self-care', 'Other'];
export const PET_SPECIES = ['cat', 'fox', 'bunny'];
export const SHOP_CATEGORIES = ['food', 'toy', 'accessory'];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createUser({ name, email, passwordHash }) {
  return db.users.insert({
    name: String(name).trim().slice(0, 60),
    email: String(email).trim().toLowerCase(),
    passwordHash,
    coins: 0
  });
}

/** Removes private fields before a user is attached to a request or sent to the client. */
export function withoutPassword(user) {
  if (!user) return user;
  const { passwordHash, ...safe } = user;
  return safe;
}

export function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, coins: user.coins };
}

export function createHabit(userId, data = {}) {
  return db.habits.insert(habitDefaults(userId, data));
}

export function habitDefaults(userId, data = {}) {
  return {
    user: userId,
    title: String(data.title || '').trim().slice(0, 100),
    description: String(data.description || '').slice(0, 240),
    category: HABIT_CATEGORIES.includes(data.category) ? data.category : 'Other',
    targetMinutes: clamp(Number(data.targetMinutes) || 0, 0, 1440),
    archived: false
  };
}

export function createPet(userId, data = {}) {
  return db.pets.insert({
    user: userId,
    species: PET_SPECIES.includes(data.species) ? data.species : 'cat',
    name: String(data.name || 'Mochi').trim().slice(0, 30) || 'Mochi',
    happiness: 75,
    energy: 80,
    xp: 0,
    level: 1,
    inventory: [],
    equippedItem: null
  });
}

/** Returns the user's pet, creating a default one if it does not exist yet. */
export function getOrCreatePet(userId) {
  return db.pets.findOne({ user: userId }) || createPet(userId);
}

/** Replaces item IDs with full shop item objects (like Mongoose populate). */
export function populatePet(pet) {
  if (!pet) return pet;
  return {
    ...pet,
    inventory: (pet.inventory || []).map((id) => db.shopItems.findById(id)).filter(Boolean),
    equippedItem: pet.equippedItem ? db.shopItems.findById(pet.equippedItem) : null
  };
}

export const clampStat = (value) => clamp(value, 0, 100);
