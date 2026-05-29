#!/usr/bin/env node
/**
 * sync-toggl.mjs
 *
 * Fetches Toggl time entries for the "Piano Practice" project and merges
 * them into shared/data/practice-log.json.
 *
 * Usage (locally):
 *   TOGGL_API_TOKEN=<your_token> node scripts/sync-toggl.mjs
 *
 * In GitHub Actions, TOGGL_API_TOKEN comes from repository secrets.
 * TOGGL_PROJECT_NAME defaults to "Piano Practice" — set it as a repo
 * variable if you name your Toggl project differently.
 *
 * Merge strategy:
 *   - Toggl entries take precedence for any date they cover
 *   - Existing JSON entries with no matching Toggl data are preserved
 *     (keeps your hand-entered history from before you started tracking)
 *   - Multiple Toggl sessions on the same day are summed; the longest
 *     session's description becomes the "piece" field
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Config ───────────────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = resolve(__dir, '../shared/data/practice-log.json');

const TOKEN        = process.env.TOGGL_API_TOKEN;
const PROJECT_NAME = process.env.TOGGL_PROJECT_NAME ?? 'Piano Practice';
const LOOKBACK_DAYS = 400; // covers 365-day grid + a few weeks buffer

// ─── Guard ────────────────────────────────────────────────────────────────────

if (!TOKEN) {
  console.error('[sync-toggl] ✗ TOGGL_API_TOKEN is not set.');
  console.error('  Get yours at: https://track.toggl.com/profile → scroll to "API Token"');
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AUTH    = Buffer.from(`${TOKEN}:api_token`).toString('base64');
const HEADERS = {
  'Authorization': `Basic ${AUTH}`,
  'Content-Type':  'application/json',
};

async function toggl(path) {
  const res = await fetch(`https://api.track.toggl.com/api/v9${path}`, { headers: HEADERS });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Toggl ${path} → HTTP ${res.status}: ${body}`);
  }
  return res.json();
}

// ─── 1. Find project ──────────────────────────────────────────────────────────

console.log(`[sync-toggl] Looking for project "${PROJECT_NAME}"…`);
const projects = await toggl('/me/projects');
const project  = projects.find(p => p.name === PROJECT_NAME);

if (!project) {
  const names = projects.map(p => `  • ${p.name}`).join('\n');
  console.warn(`[sync-toggl] ⚠ Project "${PROJECT_NAME}" not found in your Toggl workspace.`);
  console.warn(`  Your existing projects:\n${names || '  (none)'}`);
  console.warn(`  Create a project called "${PROJECT_NAME}" in Toggl, then re-run.`);
  console.warn('  Alternatively, set the TOGGL_PROJECT_NAME repo variable to match your project name.');
  process.exit(0); // soft exit — don't fail the build, just skip sync
}

console.log(`[sync-toggl] ✓ Found project "${project.name}" (id: ${project.id})`);

// ─── 2. Fetch time entries ────────────────────────────────────────────────────

const endDate   = new Date();
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - LOOKBACK_DAYS);

const startISO = startDate.toISOString().split('.')[0] + 'Z';
const endISO   = endDate.toISOString().split('.')[0] + 'Z';

console.log(`[sync-toggl] Fetching entries from ${startISO} → ${endISO}…`);

// Toggl v9 returns up to 1000 entries per call. 400 days of daily practice
// is well under that, so a single call is sufficient.
const allEntries = await toggl(
  `/me/time_entries?start_date=${encodeURIComponent(startISO)}&end_date=${encodeURIComponent(endISO)}`
);

// Filter: correct project, completed (duration > 0), not running
const practiceEntries = allEntries.filter(
  e => e.project_id === project.id && typeof e.duration === 'number' && e.duration > 0
);

console.log(`[sync-toggl] ${allEntries.length} total entries → ${practiceEntries.length} in "${PROJECT_NAME}"`);

if (practiceEntries.length === 0) {
  console.log('[sync-toggl] Nothing to merge. Log a session in Toggl first.');
  process.exit(0);
}

// ─── 3. Group by calendar date ────────────────────────────────────────────────
// Toggl returns start time in UTC. We extract the date portion (YYYY-MM-DD).
// This uses UTC date — if you practice past midnight UTC (8pm ET) the entry
// lands on the next UTC date. That's acceptable; you can also set your Toggl
// workspace timezone to match your local time (Settings → Workspace).

/** @type {Record<string, Array<{ minutes: number; piece: string }>>} */
const byDate = {};

for (const entry of practiceEntries) {
  const date    = entry.start.split('T')[0];          // "2025-05-15"
  const minutes = Math.round(entry.duration / 60);
  const piece   = (entry.description ?? '').trim() || 'Practice';

  if (!byDate[date]) byDate[date] = [];
  byDate[date].push({ minutes, piece });
}

// ─── 4. Merge into existing log ───────────────────────────────────────────────

const existing = JSON.parse(readFileSync(LOG_PATH, 'utf-8'));
let mergedCount = 0;

for (const [date, sessions] of Object.entries(byDate)) {
  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);

  // Pick the longest session's piece as the primary display piece
  const longest = sessions.reduce((a, b) => (a.minutes >= b.minutes ? a : b));

  // If multiple sessions on the same day, record the breakdown in `note`
  const note = sessions.length > 1
    ? sessions.map(s => `${s.minutes}min${s.piece !== 'Practice' ? ` — ${s.piece}` : ''}`).join('; ')
    : undefined;

  existing[date] = {
    minutes: totalMinutes,
    piece:   longest.piece,
    ...(note ? { note } : {}),
  };

  mergedCount++;
}

// ─── 5. Update sync metadata ──────────────────────────────────────────────────

existing['_toggl_synced_at'] = new Date().toISOString();

// ─── 6. Sort and write ────────────────────────────────────────────────────────
// Keep _ meta keys at top, date keys in chronological order.

const sorted = {};
for (const k of Object.keys(existing).filter(k => k.startsWith('_')).sort()) {
  sorted[k] = existing[k];
}
for (const k of Object.keys(existing).filter(k => !k.startsWith('_')).sort()) {
  sorted[k] = existing[k];
}

writeFileSync(LOG_PATH, JSON.stringify(sorted, null, 2) + '\n');

const totalDays = Object.keys(sorted).filter(k => !k.startsWith('_')).length;
console.log(`[sync-toggl] ✓ Merged ${mergedCount} Toggl days → ${totalDays} total days in log`);
