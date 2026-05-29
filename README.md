# rubyngo.github.io — Portfolio Monorepo

Two static-site MVPs built with Astro, deploying to GitHub Pages. Same brand, content model, and design tokens. Different home/hero.

> **Source of truth:** Notion portfolio page — [Ngoc (Ruby) Ngo](https://www.notion.so/Ngoc-Ruby-Ngo-1e2bf1317b4080f99029c7f06f2d8045)

```
/
├── shared/               ← Content, data, and design tokens shared by both MVPs
├── mvp-program/          ← MVP 1: Editorial "concert program" layout
└── mvp-keys/             ← MVP 2: Interactive piano hero + Gemstone Practice
```

---

## Quick start

```bash
# Install all dependencies (requires Node ≥18)
npm install          # or: cd mvp-program && npm install; cd ../mvp-keys && npm install

# Run MVP 1 locally at http://localhost:4321
npm run dev:program

# Run MVP 2 locally at http://localhost:4321
npm run dev:keys

# Build both for production
npm run build
```

Output lands in `mvp-program/dist/` and `mvp-keys/dist/`.

---

## Deploy to GitHub Pages

### Option A — Two separate repos (simplest)

1. Create two repos: `rubyngo/mvp-program` and `rubyngo/mvp-keys`
2. Push the contents of `mvp-program/` to one and `mvp-keys/` to the other
3. Enable GitHub Pages (Settings → Pages → Deploy from branch `main`, folder `/dist` or use Actions)
4. Live at `https://rubyngo.github.io/mvp-program/` and `https://rubyngo.github.io/mvp-keys/`

### Option B — One repo, two branches

```bash
# In your repo (e.g. rubyngo/portfolio)
git checkout -b deploy-program
# copy mvp-program/dist/* to root of this branch → push

git checkout -b deploy-keys
# copy mvp-keys/dist/* to root of this branch → push
```

Configure each branch as a separate GitHub Pages source.

### Option C — GitHub Actions (recommended for automation)

Create `.github/workflows/deploy-program.yml`:

```yaml
name: Deploy MVP Program
on:
  push:
    paths: ['mvp-program/**', 'shared/**']
    branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd mvp-program && npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: mvp-program/dist
          destination_dir: mvp-program
```

Duplicate for `deploy-keys.yml` with `mvp-keys`. Both publish to the `gh-pages` branch under separate sub-paths.

### Base paths

`astro.config.mjs` in each MVP already sets:
- `mvp-program`: `base: '/mvp-program'`
- `mvp-keys`:    `base: '/mvp-keys'`

If you deploy to a different path, update `base` in the respective `astro.config.mjs`.

---

## Google Analytics

Replace the placeholder in both layouts:

```
mvp-program/src/layouts/BaseLayout.astro  → line: const GA_ID = 'G-XXXXXXXXXX';
mvp-keys/src/layouts/BaseLayout.astro     → line: const GA_ID = 'G-XXXXXXXXXX';
```

Replace `G-XXXXXXXXXX` with your real GA4 Measurement ID.

---

## Owner content checklist

### Replace before shipping

- [ ] `shared/data/moments.json` — fill in all 5 proud moments
- [ ] `shared/data/metrics.json` — confirm recital count, piece count, graduation date
- [ ] `shared/data/practice-log.json` — pre-seeded; auto-synced by Toggl workflow (see below)
- [ ] `shared/content/experience.json` — fill `[PLACEHOLDER]` dates for BoA and Dickinson
- [ ] Both `BaseLayout.astro` files — replace `G-XXXXXXXXXX` with real GA4 ID
- [ ] `public/resume.pdf` in both MVPs — replace placeholder with real PDF
- [ ] `public/images/` — add performance photos referenced in pages

### Auto-sync practice log from Toggl (one-time setup)

The workflow `.github/workflows/sync-practice.yml` runs nightly at 3 AM ET. It fetches your Toggl time entries and commits any new practice sessions to `shared/data/practice-log.json`, which triggers a site rebuild automatically.

**Step 1 — Create a Toggl project**
1. Sign up free at [toggl.com/track](https://toggl.com/track)
2. Create a project named **Piano Practice** (exact name matters, or change `TOGGL_PROJECT_NAME` below)

**Step 2 — Add your API token to GitHub**
1. In Toggl: click your avatar → Profile → scroll to **API Token** → copy it
2. In GitHub: repo **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `TOGGL_API_TOKEN`
   - Value: paste your token

**Step 3 — (Optional) override project name**
If your Toggl project is named something other than "Piano Practice":
- Settings → Secrets and variables → Actions → **Variables** tab → New variable
  - Name: `TOGGL_PROJECT_NAME`
  - Value: your project name

**Step 4 — Log practice in Toggl**
- Start a Toggl timer under "Piano Practice"
- Set the description to what you're working on, e.g. `Chopin Ballade No. 1`
- Stop it when you're done — the sync picks it up the next morning

**Running the sync manually**
```bash
TOGGL_API_TOKEN=<your_token> node scripts/sync-toggl.mjs
```
Or trigger it instantly from the GitHub Actions tab: **Sync practice log → Run workflow**.

### Add photos

Drop images into `mvp-program/public/images/` and `mvp-keys/public/images/`. Then update `src` attributes in pages. Image placeholders currently show a dark box with "photo" text.

### Add recordings (music page)

Edit `mvp-program/src/pages/music.astro` and `mvp-keys/src/pages/music.astro`. Replace the `.embed-box` placeholder divs with your YouTube/SoundCloud `<iframe>` embed code.

### Add blog posts

1. Create `src/content/blog/` directory in the MVP you want
2. Add `.md` files with frontmatter: `title`, `date`, `summary`
3. Uncomment the content collection loader in `src/pages/blog/index.astro`

### Key content (MVP 2 only)

Edit `mvp-keys/src/components/PianoHero.astro`. See `mvp-keys/KEY_MAP.md` for full mapping.

### Language toggle (EN/VI)

Translations live in `shared/content/i18n.json`. The current MVP uses `lang='en'` on every page. To enable the VI toggle:
1. Add `?lang=vi` query-param handling to a small client script, OR
2. Create parallel `/vi/` page routes importing `i18n.vi` strings
The nav already shows "Tiếng Việt" / "English" — wire it up when ready.

---

## Content files

| File | What it controls | How often to edit |
|------|-----------------|-------------------|
| `shared/data/moments.json` | 5 proud moments on `/moments` and home strip | Once, then as new moments happen |
| `shared/data/practice-log.json` | Gemstone Practice heatmap (MVP 2) and practice day count | Quarterly |
| `shared/data/metrics.json` | Numbers on About page | When numbers change |
| `shared/content/projects.json` | All project pages and flagship home strip | When new projects ship |
| `shared/content/experience.json` | Experience page | When job/school changes |
| `shared/content/skills.json` | Skills page | Annually |
| `shared/content/i18n.json` | All EN/VI strings | When copy changes |
| `mvp-keys/KEY_MAP.md` | Piano key content mapping reference | When editing keys |

---

## MVP comparison — which to ship?

| | **MVP 1 — The Program** | **MVP 2 — Keys of Proof** |
|---|---|---|
| **Home experience** | Dark hero → editorial scroll → proof | Piano keyboard → click a key → proof |
| **Best for** | Recruiters who skim quickly; photography-forward | Visitors who explore; memorable first impression |
| **Differentiator** | Sonata-form scroll, Parable editorial mood | Interactive piano, Gemstone Practice |
| **JS dependency** | Minimal (waveform animation only) | Piano interaction + canvas waveform |
| **Maintenance** | Lower — mostly content updates | Slightly higher — key content in component |
| **Shareability** | Strong if hero photo is great | Very high — unique and shareable |
| **Production merge** | Use as base layout | Port piano hero + gemstone to Program site |

**Recommendation for production merge:** Take MVP 1's scroll structure and apply MVP 2's piano hero as the home cover section, then add Gemstone Practice to `/about`. Best of both.

---

## Tech stack

- [Astro](https://astro.build) 4.x — static site generator
- Zero JS frameworks — vanilla JS only for interactivity
- Google Fonts: Fraunces (serif display) + Inter (body)
- Palette: Hall Black `#0a0a0a` · Score Cream `#f5f0e8` · Pearl `#7eb8c9`
- GitHub Pages static hosting

---

## Directory structure

```
my-portfolio/
├── package.json                   ← workspace root
├── README.md                      ← this file
├── shared/
│   ├── content/
│   │   ├── i18n.json             ← EN/VI strings
│   │   ├── projects.json         ← all project data
│   │   ├── experience.json       ← work + education
│   │   └── skills.json           ← skills by category
│   ├── data/
│   │   ├── practice-log.json     ← piano practice sessions
│   │   ├── moments.json          ← proud moments (FILL IN)
│   │   └── metrics.json          ← numbers for About page
│   └── styles/
│       └── tokens.css            ← design tokens reference
├── mvp-program/
│   ├── astro.config.mjs
│   ├── package.json
│   ├── public/
│   │   ├── favicon.svg
│   │   └── resume.pdf            ← REPLACE with real PDF
│   └── src/
│       ├── layouts/BaseLayout.astro
│       ├── components/
│       │   ├── Nav.astro
│       │   ├── Footer.astro
│       │   ├── Waveform.astro
│       │   ├── ProjectCard.astro
│       │   └── MomentTeaser.astro
│       ├── pages/
│       │   ├── index.astro       ← home (sonata-form scroll)
│       │   ├── about.astro       ← dual timeline
│       │   ├── projects.astro
│       │   ├── music.astro
│       │   ├── moments.astro
│       │   ├── experience.astro
│       │   ├── skills.astro
│       │   ├── contact.astro
│       │   └── blog/index.astro
│       └── styles/global.css
└── mvp-keys/
    ├── astro.config.mjs
    ├── KEY_MAP.md                 ← piano key content reference
    ├── package.json
    ├── public/
    │   ├── favicon.svg
    │   └── resume.pdf            ← REPLACE with real PDF
    └── src/
        ├── layouts/BaseLayout.astro
        ├── components/
        │   ├── Nav.astro
        │   ├── Footer.astro
        │   ├── PianoHero.astro   ← interactive piano
        │   ├── GemstoneGrid.astro← 365-day practice grid
        │   ├── GemstonePiano.astro← practice piano heatmap
        │   ├── ProjectCard.astro
        │   └── MomentTeaser.astro
        ├── pages/
        │   ├── index.astro       ← home (piano hero)
        │   ├── about.astro       ← gemstone practice
        │   └── ... (same as mvp-program)
        └── styles/global.css
```
