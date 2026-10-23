// Lightweight local JSON database (replaces MongoDB/Mongoose).
// All data lives in a single JSON file (default: server/src/data/data.json).
// The whole database is kept in memory and written to disk after every change.
// Writes are synchronous, so a "check then write" sequence inside one request
// cannot be interleaved with another request (Node runs JS on a single thread).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const DB_FILE = process.env.DB_FILE
  ? path.resolve(process.env.DB_FILE)
  : fileURLToPath(new URL('./data/data.json', import.meta.url));

const SHOP_SEED_FILE = fileURLToPath(new URL('./data/shopitems.json', import.meta.url));

const COLLECTIONS = ['users', 'pets', 'habits', 'habitCompletions', 'shopItems', 'rewardTransactions'];

let state = null;

function emptyState() {
  return Object.fromEntries(COLLECTIONS.map((name) => [name, []]));
}

function load() {
  if (!fs.existsSync(DB_FILE)) {
    state = emptyState();
    return;
  }
  const raw = fs.readFileSync(DB_FILE, 'utf8').replace(/^\uFEFF/, '');
  try {
    state = raw.trim() ? JSON.parse(raw) : emptyState();
  } catch (error) {
    // Keep a copy of the broken file instead of silently losing data.
    const backup = DB_FILE.replace(/\.json$/, `.corrupt-${Date.now()}.json`);
    fs.copyFileSync(DB_FILE, backup);
    console.warn(`data.json could not be parsed (${error.message}). A backup was saved to ${backup}; starting with an empty database.`);
    state = emptyState();
  }
  for (const name of COLLECTIONS) if (!Array.isArray(state[name])) state[name] = [];
}

function ensureLoaded() {
  if (!state) load();
}

export function save() {
  ensureLoaded();
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const json = JSON.stringify(state, null, 2);
  const tmp = `${DB_FILE}.tmp`;
  try {
    // Write to a temp file then rename, so a crash never leaves a half-written data.json.
    fs.writeFileSync(tmp, json, 'utf8');
    fs.renameSync(tmp, DB_FILE);
  } catch {
    // Windows can occasionally refuse the rename (file locked by an editor/antivirus).
    fs.writeFileSync(DB_FILE, json, 'utf8');
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { force: true });
  }
}

export const newId = () => crypto.randomBytes(12).toString('hex');
export const isValidId = (id) => typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);

const clone = (value) => (value == null ? value : structuredClone(value));
const now = () => new Date().toISOString();

// Turns a query object like { user: id, archived: false } or a function into a predicate.
function toPredicate(query = {}) {
  if (typeof query === 'function') return query;
  const entries = Object.entries(query);
  return (row) => entries.every(([key, expected]) => {
    if (Array.isArray(expected)) return expected.includes(row[key]);
    return row[key] === expected;
  });
}

class Collection {
  constructor(name) {
    this.name = name;
  }

  get rows() {
    ensureLoaded();
    return state[this.name];
  }

  /** Returns copies of all matching documents (mutating them does not change the database). */
  find(query) {
    return this.rows.filter(toPredicate(query)).map(clone);
  }

  findOne(query) {
    return clone(this.rows.find(toPredicate(query)) ?? null);
  }

  findById(id) {
    return this.findOne({ _id: String(id) });
  }

  count(query) {
    return this.rows.filter(toPredicate(query)).length;
  }

  insert(doc) {
    const timestamp = now();
    const row = { _id: newId(), ...clone(doc), createdAt: timestamp, updatedAt: timestamp };
    this.rows.push(row);
    save();
    return clone(row);
  }

  insertMany(docs) {
    const timestamp = now();
    const rows = docs.map((doc) => ({ _id: newId(), ...clone(doc), createdAt: timestamp, updatedAt: timestamp }));
    this.rows.push(...rows);
    save();
    return rows.map(clone);
  }

  /** Updates the first matching document. `changes` is an object or a function (doc) => object. */
  updateOne(query, changes) {
    const row = this.rows.find(toPredicate(query));
    if (!row) return null;
    const patch = typeof changes === 'function' ? changes(clone(row)) : changes;
    Object.assign(row, clone(patch), { _id: row._id, createdAt: row.createdAt, updatedAt: now() });
    save();
    return clone(row);
  }

  updateById(id, changes) {
    return this.updateOne({ _id: String(id) }, changes);
  }

  deleteOne(query) {
    const index = this.rows.findIndex(toPredicate(query));
    if (index === -1) return false;
    this.rows.splice(index, 1);
    save();
    return true;
  }
}

export const db = Object.fromEntries(COLLECTIONS.map((name) => [name, new Collection(name)]));

/** Inserts or updates shop items from shopitems.json (matched by name). Returns the item count. */
export function seedShopItems() {
  ensureLoaded();
  const items = JSON.parse(fs.readFileSync(SHOP_SEED_FILE, 'utf8').replace(/^\uFEFF/, ''));
  const timestamp = now();
  for (const item of items) {
    const existing = state.shopItems.find((row) => row.name === item.name);
    if (existing) Object.assign(existing, item, { updatedAt: timestamp });
    else state.shopItems.push({ _id: newId(), ...item, createdAt: timestamp, updatedAt: timestamp });
  }
  save();
  return items.length;
}

/** Loads data.json (creating it if needed) and makes sure the shop catalogue exists. */
export function initDatabase() {
  load();
  if (state.shopItems.length === 0) seedShopItems();
  else save();
  return DB_FILE;
}
