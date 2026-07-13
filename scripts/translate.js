#!/usr/bin/env node
/**
 * Auto-translate English content to Vietnamese using Gemini API.
 * Reads shared/content/*.json, writes back _vi fields for changed strings.
 * Uses SHA-256 hashes to skip strings that haven't changed.
 *
 * Usage: GEMINI_API_KEY=<key> node scripts/translate.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HASHES_FILE = join(ROOT, 'shared/content/.translation-hashes.json');
const MODEL = 'gemini-2.5-flash';
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) { console.error('GEMINI_API_KEY not set'); process.exit(1); }

// ── Helpers ──────────────────────────────────────────────────────────────────

function hash(str) {
  return createHash('sha256').update(str).digest('hex').slice(0, 12);
}

function loadHashes() {
  if (existsSync(HASHES_FILE)) return JSON.parse(readFileSync(HASHES_FILE, 'utf8'));
  return {};
}

function saveHashes(hashes) {
  writeFileSync(HASHES_FILE, JSON.stringify(hashes, null, 2));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

async function gemini(texts) {
  // texts: array of strings to translate
  // returns: array of translated strings in the same order
  const payload = texts.map((t, i) => `[${i}] ${t}`).join('\n\n');

  const prompt = `You are a professional Vietnamese translator for a personal portfolio website.
Translate each numbered item below from English to Vietnamese.

Rules:
- Keep proper nouns unchanged: people names, company names (Bank of America, FINRA, Carnegie Hall, Kaufman Music Center, NY Piano Society, Dickinson College, NYU, Mekong Capital, Genuine Parts Company, InfoRe Technology, Girls Who Code, Grace Hopper)
- Keep technical terms in English: Python, SQL, R, GitHub, FIX Protocol, FINRA, NLP, ML, AI, LLM, API, ETL, dbt, Airflow, Spark, PostgreSQL, Snowflake, Docker, AWS, GCP, Azure, React, Django, XGBoost, PyTorch, Pandas, NumPy, scikit-learn, Cloudflare, Tableau, Splunk, Kaggle, K-Modes, BERT, Hugging Face
- Keep musical piece titles and composer names unchanged: Tchaikovsky, Wagner, Liszt, Grieg, Chopin, Brahms, Schubert, Swan Lake, Tristan und Isolde, Isoldens Liebestod, Mazurka, Piano Concerto
- Keep dates and numbers as-is
- Respond ONLY with the translated items in the same numbered format [0], [1], etc.
- Do not add explanations or notes

Items to translate:
${payload}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.candidates[0].content.parts[0].text.trim();

  // Parse [0] ... [1] ... format
  const results = new Array(texts.length).fill('');
  const regex = /\[(\d+)\]\s*([\s\S]*?)(?=\[\d+\]|$)/g;
  let m;
  while ((m = regex.exec(raw)) !== null) {
    const idx = parseInt(m[1], 10);
    if (idx < texts.length) results[idx] = m[2].trim();
  }
  return results;
}

// Translate only strings whose hash has changed; update hashes map in place
async function translateFields(hashes, namespace, strings) {
  const toTranslate = [];
  const indices = [];

  for (let i = 0; i < strings.length; i++) {
    const key = `${namespace}:${i}`;
    const h = hash(strings[i]);
    if (hashes[key] !== h) {
      toTranslate.push(strings[i]);
      indices.push(i);
    }
  }

  if (toTranslate.length === 0) {
    console.log(`  ✓ ${namespace} — no changes`);
    return strings.map((_, i) => null); // null = unchanged
  }

  console.log(`  → Translating ${toTranslate.length} strings in ${namespace}…`);
  await new Promise(r => setTimeout(r, 300)); // gentle rate limiting
  const translated = await gemini(toTranslate);

  const results = new Array(strings.length).fill(null);
  for (let j = 0; j < indices.length; j++) {
    const i = indices[j];
    const key = `${namespace}:${i}`;
    results[i] = translated[j];
    hashes[key] = hash(strings[i]);
  }
  return results;
}

// ── Content processors ────────────────────────────────────────────────────────

async function translateI18n(hashes) {
  const path = join(ROOT, 'shared/content/i18n.json');
  const data = readJson(path);
  const en = data.en;

  // Flatten all en strings into an ordered array
  function flattenObj(obj, prefix = '') {
    const entries = [];
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') entries.push({ key, value: v });
      else if (typeof v === 'object') entries.push(...flattenObj(v, key));
    }
    return entries;
  }

  const entries = flattenObj(en);
  const strings = entries.map(e => e.value);
  const translated = await translateFields(hashes, 'i18n', strings);

  // Rebuild vi section from translations (fall back to existing vi if unchanged)
  function setNested(obj, keyPath, value) {
    const parts = keyPath.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function getNested(obj, keyPath) {
    return keyPath.split('.').reduce((o, k) => o?.[k], obj);
  }

  for (let i = 0; i < entries.length; i++) {
    const { key } = entries[i];
    // Skip lang_toggle — it's intentionally opposite in vi
    if (key === 'nav.lang_toggle') continue;
    const newVal = translated[i];
    if (newVal) setNested(data.vi, key, newVal);
    else {
      // Ensure vi has a value (keep existing or copy en)
      const existing = getNested(data.vi, key);
      if (!existing) setNested(data.vi, key, entries[i].value);
    }
  }

  writeJson(path, data);
  console.log('  ✓ i18n.json updated');
}

async function translatePianoKeys(hashes) {
  const path = join(ROOT, 'shared/content/piano-keys.json');
  const data = readJson(path);

  const allKeys = [...data.white_keys, ...data.black_keys, data.cta_key];
  const titles = allKeys.map(k => k.title);
  const bodies = allKeys.map(k => k.body);

  const [titlesVi, bodiesVi] = await Promise.all([
    translateFields(hashes, 'piano-keys:title', titles),
    translateFields(hashes, 'piano-keys:body', bodies),
  ]);

  for (let i = 0; i < allKeys.length; i++) {
    if (titlesVi[i]) allKeys[i].title_vi = titlesVi[i];
    if (bodiesVi[i])  allKeys[i].body_vi  = bodiesVi[i];
  }

  writeJson(path, data);
  console.log('  ✓ piano-keys.json updated');
}

async function translateProjects(hashes) {
  const path = join(ROOT, 'shared/content/projects.json');
  const data = readJson(path);

  const fields = ['title', 'subtitle', 'description', 'narrative', 'modal_about'];
  for (const field of fields) {
    const strings = data.map(p => p[field] || '');
    const translated = await translateFields(hashes, `projects:${field}`, strings);
    for (let i = 0; i < data.length; i++) {
      if (translated[i]) data[i][`${field}_vi`] = translated[i];
    }
  }

  writeJson(path, data);
  console.log('  ✓ projects.json updated');
}

async function translateExperience(hashes) {
  const path = join(ROOT, 'shared/content/experience.json');
  const data = readJson(path);

  // role + description
  for (const field of ['role', 'description']) {
    const strings = data.map(e => e[field] || '');
    const translated = await translateFields(hashes, `experience:${field}`, strings);
    for (let i = 0; i < data.length; i++) {
      if (translated[i]) data[i][`${field}_vi`] = translated[i];
    }
  }

  // highlights (array of strings per entry)
  for (let i = 0; i < data.length; i++) {
    const highlights = data[i].highlights || [];
    const translated = await translateFields(hashes, `experience:highlights:${i}`, highlights);
    const updated = translated.map((v, j) => v || highlights[j]);
    if (updated.some((v, j) => v !== highlights[j])) {
      data[i].highlights_vi = updated;
    }
  }

  writeJson(path, data);
  console.log('  ✓ experience.json updated');
}

async function translateMoments(hashes) {
  const path = join(ROOT, 'shared/data/moments.json');
  const data = readJson(path);
  const moments = data.moments;

  const titles = moments.map(m => m.title);
  const summaries = moments.map(m => m.summary_en || '');

  const [titlesVi, summariesVi] = await Promise.all([
    translateFields(hashes, 'moments:title', titles),
    translateFields(hashes, 'moments:summary', summaries),
  ]);

  for (let i = 0; i < moments.length; i++) {
    if (titlesVi[i])   moments[i].title_vi   = titlesVi[i];
    if (summariesVi[i]) moments[i].summary_vi = summariesVi[i];
  }

  writeJson(path, data);
  console.log('  ✓ moments.json updated');
}

async function translateSkills(hashes) {
  const path = join(ROOT, 'shared/content/skills.json');
  const data = readJson(path);

  const names = data.categories.map(c => c.name);
  const translated = await translateFields(hashes, 'skills:name', names);
  for (let i = 0; i < data.categories.length; i++) {
    if (translated[i]) data.categories[i].name_vi = translated[i];
  }

  writeJson(path, data);
  console.log('  ✓ skills.json updated');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌐 Auto-translate: English → Vietnamese\n');
  const hashes = loadHashes();

  try {
    console.log('📄 i18n strings');
    await translateI18n(hashes);

    console.log('\n🎹 Piano keys');
    await translatePianoKeys(hashes);

    console.log('\n🗂  Projects');
    await translateProjects(hashes);

    console.log('\n💼 Experience');
    await translateExperience(hashes);

    console.log('\n✨ Moments');
    await translateMoments(hashes);

    console.log('\n🔧 Skills');
    await translateSkills(hashes);

    saveHashes(hashes);
    console.log('\n✅ All translations complete. Hashes saved.');
  } catch (err) {
    console.error('\n❌ Translation failed:', err.message);
    process.exit(1);
  }
}

main();
