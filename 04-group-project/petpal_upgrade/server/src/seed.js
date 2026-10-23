import 'dotenv/config';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ShopItem } from './models.js';

const dataUrl = new URL('./data/shopitems.json', import.meta.url);

try {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/petpal');
  const items = JSON.parse(await readFile(fileURLToPath(dataUrl), 'utf8'));
  for (const item of items) {
    // Upsert by unique name: rerunning the seed updates existing catalog items instead of duplicating them.
    await ShopItem.updateOne({ name: item.name }, { $set: item }, { upsert: true });
  }
  console.log(`Seeded/updated ${items.length} shop items in MongoDB database "petpal".`);
} catch (error) {
  console.error('Seeding failed. Check that MongoDB is running and server/.env has a valid MONGO_URI.');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
