import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '..');
const targetDir = path.resolve(__dirname, '..', '..', 'dsantos-deploy');

const EXCLUDED = [
  'node_modules',
  'dist',
  '.git',
  'cloudflared.exe',
  'public_url.txt',
  'tunnel.log',
  'server.log',
  'server-err.log',
];

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      if (EXCLUDED.includes(item) || item.endsWith('.log')) continue;
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

copyRecursive(srcDir, targetDir);

console.log('Deploy folder successfully created at:', targetDir);
