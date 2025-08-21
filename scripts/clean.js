import { rmSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(__dirname, '../dist');

try {
  rmSync(distPath, { recursive: true, force: true });
  console.log('✅ Cleaned dist directory');
} catch (error) {
  console.log('⚠️ Clean skipped - dist directory may not exist');
}
