# Ruby Ngo — Session Preferences & Instructions

> Read this at the start of every session. It captures how Ruby likes to work,
> what she's already set up, and what pitfalls to avoid.

---

## Who Ruby is

**Ngoc (Ruby) Ngo** — software/data engineer + classical pianist.

- NYU MS Data Science (2025–2027, in progress)
- Prev: Bank of America — Global Technology Analyst (2022), Software Engineer II (2024)
- Internships: InfoRe Technology (2019), Mekong Capital (2020), Genuine Parts Company (2021)
- Classical piano: Carnegie Hall debut, Kaufman Music Center, NY Piano Society
- Romantic era repertoire: Chopin, Brahms, Schubert, Tchaikovsky
- Email: ngocrubytin@gmail.com · LinkedIn: linkedin.com/in/ngocrubyngo
- GitHub: rubyngo1610 · Live site: https://rubyngo1610.github.io

**Brand line:** "She's the rare person who is both a serious musician and a data enthusiast — here's the proof."
**Audience:** Recruiters, classmates, friends. 60-second hook.
**Tone:** Editorial, dark concert-hall aesthetic. NOT a generic dev portfolio.

---

## How Ruby likes to work

1. **Just do it** — Ruby does not want long explanations before acting. Make the change, commit, push, then give a short summary of what changed and why.
2. **Short summaries** — bullet points or a small table. No recapping what she can already see.
3. **Revert cleanly when asked** — if Ruby says "revert it", use `git checkout <sha> -- path/to/file` to restore specific files without touching the whole repo.
4. **Don't break what's working** — read the file before editing. Never rewrite a component from scratch unless explicitly asked.
5. **Push immediately after committing** — every change goes to `main` and auto-deploys via GitHub Actions. No local-only commits sitting around.
6. **Verify via GitHub Actions, not local build** — `astro build` fails in the Claude Code environment (Astro 4.15.0 reads stdin, hangs in non-TTY). Check CI status using the GitHub API with the stored PAT instead.

---

## Git & deploy workflow

```
main branch → push → GitHub Actions builds → GitHub Pages live
```

- Repo: `https://github.com/rubyngo1610/rubyngo1610.github.io`
- GitHub PAT is stored in macOS keychain (retrieve with `git credential fill`):
  ```bash
  git credential fill <<< $'protocol=https\nhost=github.com\n'
  ```
- Trigger a workflow manually:
  ```bash
  TOKEN="<pat>"
  curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/rubyngo1610/rubyngo1610.github.io/actions/workflows/<workflow>.yml/dispatches" \
    -d '{"ref":"main"}'
  ```
- Check run status:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" \
    "https://api.github.com/repos/rubyngo1610/rubyngo1610.github.io/actions/runs?per_page=5"
  ```

---

## Auto-syncs already running (do not re-create)

| What | How | Schedule | Key file |
|------|-----|----------|----------|
| Piano practice log | Toggl → `sync-toggl.mjs` → `practice-log.json` | 3 AM ET nightly | `.github/workflows/sync-practice.yml` |
| GitHub contributions | GraphQL → `sync-github.mjs` → `commit-log.json` | 4 AM ET nightly | `.github/workflows/sync-github.yml` |
| Resume PDF | macOS LaunchAgent watches Google Drive folder | On file change | `scripts/push-resume.sh` |

**Toggl notes:**
- Project name: **"Piano Practice Hours"** (must match exactly)
- Free plan limit: API rejects start dates older than ~90 days → `LOOKBACK_DAYS = 89`
- Token stored in GitHub secret `TOGGL_API_TOKEN`

**GitHub contribution sync notes:**
- Uses GraphQL `contributionsCollection` — same source as the GitHub profile graph
- `GITHUB_TOKEN` (automatic in Actions) is sufficient; no extra PAT needed
- Clears and rebuilds `commit-log.json` entirely on each run

**Resume auto-deploy notes:**
- Source: `~/Library/CloudStorage/GoogleDrive-ngocrubytin@gmail.com/My Drive/CV application/HongNgoc_Ngo-Resume-Latest.pdf`
- Dest: `mvp-keys/public/resume.pdf`
- LaunchAgent: `~/Library/LaunchAgents/dev.rubyngo.resume-sync.plist` (loaded, active)
- Script: `scripts/push-resume.sh` (waits 3s, checks size > 10KB, diffs, commits, pushes)
- Also runs on dev/build via `predev`/`prebuild` hooks in root `package.json`

---

## Known pitfalls

| Pitfall | Detail |
|---------|--------|
| `astro build` fails locally | Astro 4.15.0 hangs reading stdin in non-TTY. Always let CI build. |
| Toggl 400 error | "start_date must not be earlier than X" = free plan 90-day limit. Keep `LOOKBACK_DAYS = 89`. |
| Commit grid blank | `commit-log.json` entries must fall within last 365 days. Old dates are ignored by the grid. |
| Heatmap UTC vs local | GemstoneGrid uses `getFullYear()/getMonth()/getDate()` (local time) — do not revert to `toISOString()`. |
| Astro scoped CSS + JS | Dynamically created DOM elements (`document.createElement`) do not get Astro's scoped style attributes. Use server-side rendering or `is:global`. |
| Push rejected | GitHub sync bots commit nightly — always `git pull --rebase` before pushing if rejected. |

---

## Outstanding owner tasks (not yet completed)

- [ ] **GA4 ID** — replace `G-XXXXXXXXXX` in `mvp-keys/src/layouts/BaseLayout.astro`
- [ ] **Music page embeds** — paste real YouTube/SoundCloud `<iframe>` into `mvp-keys/src/pages/music.astro`
- [ ] **PianoHero placeholders** — fill remaining `[PLACEHOLDER]` key bodies in `PianoHero.astro` (see `mvp-keys/KEY_MAP.md` for reference)
- [ ] **Performance photos** — add photos to `mvp-keys/public/images/` (non-moments shots: recitals, headshots)
- [ ] **Moments images** — moments 1, 3, 4, 5 have `"image": null` in `shared/data/moments.json`; add photos when available

---

## Content source of truth

| File | Controls |
|------|----------|
| `shared/data/practice-log.json` | Piano heatmap (auto-synced via Toggl) |
| `shared/data/commit-log.json` | Code heatmap (auto-synced via GitHub GraphQL) |
| `shared/data/moments.json` | Proud Moments page + home teaser |
| `shared/data/metrics.json` | "By the numbers" section on About |
| `shared/content/projects.json` | All projects + modal content |
| `shared/content/experience.json` | Experience page timeline |
| `shared/content/skills.json` | Skills page |
| `shared/content/i18n.json` | All EN/VI strings and bio copy |
