import 'dotenv/config';
import { DB_FILE, seedShopItems } from './db.js';

try {
  // Upsert by unique name: rerunning the seed updates existing catalog items instead of duplicating them.
  const count = seedShopItems();
  console.log(`Seeded/updated ${count} shop items in ${DB_FILE}`);
} catch (error) {
  console.error('Seeding failed.');
  console.error(error.message);
  process.exitCode = 1;
}
