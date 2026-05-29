# rubyngo1610.github.io

Personal portfolio of Ngoc (Ruby) Ngo — live at **https://rubyngo1610.github.io**

Built with Astro 4 (static). Interactive piano hero, gemstone practice heatmap, live GitHub commit grid, dual timeline.

> **Content source of truth:** [Notion — Ngoc (Ruby) Ngo](https://www.notion.so/Ngoc-Ruby-Ngo-1e2bf1317b4080f99029c7f06f2d8045)

---

## Local development

```bash
npm run dev       # → http://localhost:4321  (hot reload)
npm run build     # production build → mvp-keys/dist/
npm run preview   # preview the built output locally
```

Requires Node ≥ 18.

---

## Deploy

Push to `main` — GitHub Actions builds and deploys automatically.

```bash
git add -A
git commit -m "your message"
git push
```

To trigger a deploy manually without a code change: **Actions → Deploy to GitHub Pages → Run workflow.**

---

## Auto-sync practice log (Toggl)

The workflow `.github/workflows/sync-practice.yml` runs nightly at 3 AM ET.
It fetches Toggl time entries and commits new practice sessions to `shared/data/practice-log.json`, which triggers a redeploy automatically.

### One-time setup

**1 — Create a Toggl project**
- Sign up free at [toggl.com/track](https://toggl.com/track)
- Create a project named **Piano Practice**

**2 — Add your API token to GitHub**
- Toggl: avatar → Profile → scroll to **API Token** → copy
- GitHub: repo **Settings → Secrets and variables → Actions → New repository secret**
  - Name: `TOGGL_API_TOKEN` · Value: paste token

**3 — Log practice from your phone**
- Download **Toggl Track** (iOS / Android)
- Tap ▶, select **Piano Practice**, type what you're working on, tap ◼ when done

**Run sync manually**
```bash
TOGGL_API_TOKEN=<your_token> node scripts/sync-toggl.mjs
```

---

## Content files

| File | Controls | Edit when |
|------|----------|-----------|
| `shared/data/practice-log.json` | Gemstone practice heatmap | Auto-synced by Toggl |
| `shared/data/moments.json` | Proud moments on `/moments` and home | New milestone happens |
| `shared/data/metrics.json` | Numbers on About page | Numbers change |
| `shared/content/projects.json` | All projects + home strip | New project ships |
| `shared/content/experience.json` | Experience page | Job / school changes |
| `shared/content/skills.json` | Skills page | Annually |
| `shared/content/i18n.json` | All EN/VI strings and bio copy | Copy changes |
| `mvp-keys/KEY_MAP.md` | Piano key content reference | When editing PianoHero |

---

## Owner checklist

- [ ] `mvp-keys/public/resume.pdf` — replace placeholder with real PDF
- [ ] `mvp-keys/public/images/` — add performance photos
- [ ] `mvp-keys/src/layouts/BaseLayout.astro` — replace `G-XXXXXXXXXX` with real GA4 ID
- [ ] `mvp-keys/src/pages/music.astro` — paste YouTube/SoundCloud `<iframe>` into embed placeholders
- [ ] `mvp-keys/src/components/PianoHero.astro` — fill remaining `[PLACEHOLDER]` key bodies (see KEY_MAP.md)
- [ ] Toggl setup (see above)

---

## Stack

- [Astro](https://astro.build) 4.x — static output
- Vanilla JS only — no framework
- Google Fonts: Fraunces (serif) + Inter (sans)
- Palette: Hall Black `#0a0a0a` · Score Cream `#f5f0e8` · Pearl `#7eb8c9` · Amber `#c9a87e`
- Hosted on GitHub Pages

---

## Directory structure

```
rubyngo1610.github.io/
├── .github/workflows/
│   ├── deploy.yml            ← builds + deploys on push to main
│   └── sync-practice.yml     ← nightly Toggl → practice-log.json
├── scripts/
│   └── sync-toggl.mjs        ← Toggl API sync script
├── shared/
│   ├── content/
│   │   ├── i18n.json         ← EN/VI strings
│   │   ├── projects.json     ← all project data
│   │   ├── experience.json   ← work + education
│   │   └── skills.json
│   ├── data/
│   │   ├── practice-log.json ← piano practice sessions (Toggl-synced)
│   │   ├── commit-log.json   ← static GitHub commit fallback
│   │   ├── moments.json      ← proud moments
│   │   └── metrics.json      ← numbers for About page
│   └── styles/
│       └── tokens.css        ← design tokens reference
└── mvp-keys/
    ├── astro.config.mjs
    ├── KEY_MAP.md             ← piano key content reference
    ├── public/
    │   ├── favicon.svg
    │   └── resume.pdf
    └── src/
        ├── layouts/BaseLayout.astro
        ├── components/
        │   ├── PianoHero.astro      ← interactive piano (home)
        │   ├── GemstoneGrid.astro   ← 365-day practice heatmap
        │   ├── CommitGrid.astro     ← 365-day commit heatmap
        │   ├── Nav.astro
        │   ├── Footer.astro
        │   ├── Waveform.astro
        │   ├── ProjectCard.astro
        │   └── MomentTeaser.astro
        ├── pages/
        │   ├── index.astro          ← home (piano hero)
        │   ├── about.astro          ← dual timeline + gemstone grids
        │   ├── projects.astro
        │   ├── music.astro
        │   ├── moments.astro
        │   ├── experience.astro
        │   ├── skills.astro
        │   ├── contact.astro
        │   └── blog/index.astro
        └── styles/global.css
```
