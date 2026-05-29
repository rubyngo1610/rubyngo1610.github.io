/**
 * copy-resume.mjs
 *
 * Copies HongNgoc_Ngo-Resume-Latest.pdf from Google Drive into
 * mvp-keys/public/resume.pdf before every dev/build run.
 *
 * If the Google Drive path doesn't exist (e.g. in CI or on another
 * machine) the script exits quietly — the previously committed
 * resume.pdf is used instead.
 *
 * Source of truth:
 *   ~/Library/CloudStorage/GoogleDrive-ngocrubytin@gmail.com/
 *     My Drive/CV application/HongNgoc_Ngo-Resume-Latest.pdf
 *
 * To update the live site with a new resume:
 *   1. Save the new PDF as HongNgoc_Ngo-Resume-Latest.pdf in Google Drive
 *   2. Run  npm run dev  or  npm run build  — it copies automatically
 *   3. git add mvp-keys/public/resume.pdf && git commit && git push
 */

import { copyFileSync, existsSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const RESUME_SOURCE = resolve(
  homedir(),
  'Library/CloudStorage/GoogleDrive-ngocrubytin@gmail.com/My Drive/CV application/HongNgoc_Ngo-Resume-Latest.pdf'
);

const __dir = dirname(fileURLToPath(import.meta.url));
const RESUME_DEST = resolve(__dir, '../mvp-keys/public/resume.pdf');

if (!existsSync(RESUME_SOURCE)) {
  console.log('⚠  resume source not found — keeping existing resume.pdf');
  console.log('   expected:', RESUME_SOURCE);
  process.exit(0);
}

const srcSize = statSync(RESUME_SOURCE).size;
const destSize = existsSync(RESUME_DEST) ? statSync(RESUME_DEST).size : 0;

if (srcSize === destSize) {
  console.log('✓  resume.pdf already up to date');
  process.exit(0);
}

copyFileSync(RESUME_SOURCE, RESUME_DEST);
console.log(`✓  resume.pdf updated from Google Drive (${(srcSize / 1024).toFixed(0)} KB)`);
