#!/usr/bin/env node
/**
 * sync-github.mjs
 *
 * Fetches the past year of GitHub contribution data via the GraphQL API
 * (same source as the GitHub profile contribution graph) and writes it
 * to shared/data/commit-log.json.
 *
 * Usage (locally):
 *   GITHUB_TOKEN=<your_pat> node scripts/sync-github.mjs
 *
 * In GitHub Actions, GITHUB_TOKEN is provided automatically.
 *
 * The GraphQL contributionsCollection endpoint returns:
 *   - Accurate contribution counts per day (commits + issues + PRs + reviews)
 *   - Matches exactly what the GitHub profile graph shows
 *
 * For hover tooltips, this script also fetches recent push events from the
 * REST API and merges in repo names for the last 90 days.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Config ───────────────────────────────────────────────────────────────────

const __dir   = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = resolve(__dir, '../shared/data/commit-log.json');

const TOKEN    = process.env.GITHUB_TOKEN || process.env.GH_PAT;
const USERNAME = process.env.GITHUB_USERNAME || 'rubyngo1610';

// ─── Guard ────────────────────────────────────────────────────────────────────

if (!TOKEN) {
  console.error('[sync-github] ✗ GITHUB_TOKEN (or GH_PAT) is not set.');
  console.error('  Generate a token at: https://github.com/settings/tokens');
  process.exit(1);
}

const HEADERS = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type':  'application/json',
};

// ─── 1. GraphQL: contribution calendar ───────────────────────────────────────

const today   = new Date();
const yearAgo = new Date(today);
yearAgo.setDate(yearAgo.getDate() - 365);

console.log(`[sync-github] Fetching contributions for ${USERNAME}…`);
console.log(`[sync-github] Range: ${yearAgo.toISOString().split('T')[0]} → ${today.toISOString().split('T')[0]}`);

const graphqlQuery = `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}`;

const gqlRes = await fetch('https://api.github.com/graphql', {
  method:  'POST',
  headers: HEADERS,
  body:    JSON.stringify({
    query:     graphqlQuery,
    variables: {
      login: USERNAME,
      from:  yearAgo.toISOString(),
      to:    today.toISOString(),
    },
  }),
});

if (!gqlRes.ok) {
  const body = await gqlRes.text().catch(() => '');
  throw new Error(`GraphQL HTTP ${gqlRes.status}: ${body}`);
}

const { data: gqlData, errors } = await gqlRes.json();
if (errors) {
  throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
}

const calendar = gqlData.user.contributionsCollection.contributionCalendar;
console.log(`[sync-github] ✓ Total contributions this year: ${calendar.totalContributions}`);

// Build a map: date → contribution count
const contribByDate = {};
for (const week of calendar.weeks) {
  for (const day of week.contributionDays) {
    if (day.contributionCount > 0) {
      contribByDate[day.date] = day.contributionCount;
    }
  }
}
console.log(`[sync-github] ${Object.keys(contribByDate).length} active days found`);

// ─── 2. REST: push events for repo names (last 90 days) ──────────────────────

const reposByDate = {};
try {
  // Fetch up to 3 pages (300 events) for better coverage
  for (let page = 1; page <= 3; page++) {
    const evRes = await fetch(
      `https://api.github.com/users/${USERNAME}/events/public?per_page=100&page=${page}`,
      { headers: HEADERS }
    );
    if (!evRes.ok) break;
    const events = await evRes.json();
    if (!events.length) break;

    for (const ev of events) {
      if (ev.type !== 'PushEvent') continue;
      const date = ev.created_at.split('T')[0];
      const repo = ev.repo.name.split('/')[1] ?? ev.repo.name;
      if (!reposByDate[date]) reposByDate[date] = new Set();
      reposByDate[date].add(repo);
    }
  }
  console.log(`[sync-github] ✓ Fetched repo names for ${Object.keys(reposByDate).length} days from Events API`);
} catch {
  console.warn('[sync-github] ⚠ Could not fetch Events API — contribution counts will still be accurate');
}

// ─── 3. Build new log ─────────────────────────────────────────────────────────
// We replace all non-meta entries with fresh GraphQL data.
// This clears out stale or placeholder entries.

const newLog = {
  '_note':             'Auto-synced nightly from GitHub GraphQL contributions API. Do not edit manually.',
  '_github_synced_at': today.toISOString(),
};

for (const [date, count] of Object.entries(contribByDate)) {
  const repos = reposByDate[date] ? [...reposByDate[date]] : [];
  newLog[date] = {
    commits: count,
    ...(repos.length ? { repos } : {}),
  };
}

// ─── 4. Sort and write ────────────────────────────────────────────────────────

const sorted = {};
for (const k of Object.keys(newLog).filter(k => k.startsWith('_')).sort()) {
  sorted[k] = newLog[k];
}
for (const k of Object.keys(newLog).filter(k => !k.startsWith('_')).sort()) {
  sorted[k] = newLog[k];
}

writeFileSync(LOG_PATH, JSON.stringify(sorted, null, 2) + '\n');

const total = Object.values(contribByDate).reduce((s, n) => s + n, 0);
console.log(`[sync-github] ✓ Wrote ${Object.keys(contribByDate).length} active days, ${total} total contributions`);
