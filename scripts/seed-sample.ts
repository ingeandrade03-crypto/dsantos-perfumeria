import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SAMPLE_PRODUCTS_TEMPLATE } from '../src/data/seedData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '..', 'data', 'dsantos_store.json');

if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  if (!db.products || db.products.length === 0) {
    db.products = SAMPLE_PRODUCTS_TEMPLATE;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`Successfully seeded ${SAMPLE_PRODUCTS_TEMPLATE.length} demo products into dsantos_store.json`);
  } else {
    console.log(`Database already has ${db.products.length} products. Skipping seed.`);
  }
} else {
  console.log('Database file not found at', dbPath);
}
