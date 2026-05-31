# Repo Structure & Design Direction

> Reference for any Claude session or contributor. Uphold these conventions.
> When in doubt: match what's already here rather than introducing new patterns.

---

## Directory layout

```
rubyngo1610.github.io/
├── .github/workflows/
│   ├── deploy.yml            ← build + deploy to GitHub Pages on push to main
│   ├── sync-practice.yml     ← nightly Toggl → practice-log.json (3 AM ET)
│   └── sync-github.yml       ← nightly GitHub GraphQL → commit-log.json (4 AM ET)
│
├── scripts/
│   ├── copy-resume.mjs       ← copies resume from Google Drive on dev/build
│   ├── push-resume.sh        ← triggered by LaunchAgent; commits + pushes resume
│   ├── sync-toggl.mjs        ← fetches Toggl sessions, merges into practice-log.json
│   └── sync-github.mjs       ← fetches GitHub contributions via GraphQL
│
├── shared/                   ← content/data layer shared across the site
│   ├── content/
│   │   ├── i18n.json         ← all EN + VI strings (nav, bio, labels)
│   │   ├── projects.json     ← all 9 projects (title, subtitle, tags, modal_tools, modal_about, repo, link)
│   │   ├── experience.json   ← work + education history
│   │   └── skills.json       ← skills by category
│   ├── data/
│   │   ├── practice-log.json ← piano sessions {YYYY-MM-DD: {minutes, piece, note}}
│   │   ├── commit-log.json   ← GitHub contributions {YYYY-MM-DD: {commits, repos[]}}
│   │   ├── moments.json      ← proud moments [{id, title, date, body, image, tags}]
│   │   └── metrics.json      ← "by the numbers" stats for About page
│   └── styles/
│       └── tokens.css        ← design token reference (do not import directly; use global.css)
│
├── skill/                    ← Claude session docs (this directory)
│   ├── ruby-preferences.md   ← user instructions, workflow, pitfalls
│   └── repo-structure.md     ← this file
│
├── mvp-keys/                 ← the single active MVP (interactive piano + gemstone grids)
│   ├── astro.config.mjs      ← base: '/', output: 'static', site: 'https://rubyngo1610.github.io'
│   ├── KEY_MAP.md            ← piano key content reference
│   ├── package.json
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── resume.pdf        ← auto-copied from Google Drive (real PDF, 123KB)
│   │   └── images/
│   │       └── moments/      ← carnegie-debut.jpg, girls-who-code-fair.jpg, aln-symposium.jpg, gpc-intern.jpg
│   └── src/
│       ├── layouts/
│       │   └── BaseLayout.astro   ← <head>, Nav, Footer, GA4 (ID still placeholder)
│       ├── components/
│       │   ├── PianoHero.astro    ← interactive piano on home page (10 keys, click-to-reveal)
│       │   ├── GemstoneGrid.astro ← 365-day practice heatmap (pearl/blue)
│       │   ├── CommitGrid.astro   ← 365-day commit heatmap (amber)
│       │   ├── ProjectCard.astro  ← project card with optional modal trigger
│       │   ├── ProjectModal.astro ← <dialog> popup: tools, about, video, links
│       │   ├── Nav.astro
│       │   ├── Footer.astro
│       │   ├── Waveform.astro
│       │   └── MomentTeaser.astro
│       ├── pages/
│       │   ├── index.astro        ← home: PianoHero + project strip + moment teaser
│       │   ├── about.astro        ← narrative + dual timeline + gemstone grids + metrics
│       │   ├── projects.astro     ← project grid + modals
│       │   ├── music.astro        ← recordings (YouTube/SoundCloud embeds — TODO)
│       │   ├── moments.astro      ← Proud Moments with real photos
│       │   ├── experience.astro
│       │   ├── skills.astro
│       │   ├── contact.astro
│       │   └── blog/index.astro
│       └── styles/
│           └── global.css         ← design tokens + global resets + utility classes
│
├── package.json              ← root scripts: predev/prebuild run copy-resume.mjs
└── README.md                 ← setup + deploy + Toggl + GitHub sync instructions
```

---

## Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Astro 4.x | Static output (`output: 'static'`) |
| JS | Vanilla only | No React/Vue/Svelte. Client-side JS via `<script>` in `.astro` files |
| Fonts | Google Fonts | Fraunces (serif headings) + Inter (sans body) |
| Hosting | GitHub Pages | Push to `main` → auto-deploys |
| Styling | Scoped `<style>` per component + `global.css` tokens | No CSS framework |
| Build | `npm run build` in `mvp-keys/` | Outputs to `mvp-keys/dist/` |

---

## Design system

### Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-hall-black` | `#0a0a0a` | Dark sections, backgrounds |
| `--color-score-cream` | `#f5f0e8` | Light sections, modal backgrounds |
| `--color-cream-warm` | `#ede8df` | Alternate cream sections |
| `--color-cream-mid` | `#d4cdc2` | Borders, dividers |
| `--color-pearl` | `#7eb8c9` | Practice heatmap, music accent, links |
| `--color-pearl-dim` | (rgba of pearl) | Glow on practiced days |
| `--color-amber` | `#c9a87e` | Commit heatmap, data/code accent |
| `--color-text-dark` | `#1a1714` | Primary body text |
| `--color-text-muted` | `#6b6560` | Secondary labels, metadata |

### Typography

- **Headings:** Fraunces (serif), `font-weight: 300–400`, large letter-spacing negative
- **Body / labels:** Inter (sans), `font-weight: 400–600`
- **Label chips:** `font-size: var(--text-xs)`, `letter-spacing: 0.08–0.12em`, `text-transform: uppercase`
- **Pull quotes:** Fraunces italic, light weight

### Spacing scale
Uses CSS custom properties: `--space-1` (4px) → `--space-16` (64px). Always use spacing tokens, never raw pixel values.

### Section cadence (page rhythm)
Dark (`section--dark`) → Cream (`section--cream`) → Cream-warm (`section--cream-warm`) → repeat.
Never two dark sections back to back.

### Component conventions

- **Program label** (`<span class="program-label">`) — small all-caps label above every section heading
- **Movement label** — italic serif, pearl color, smaller — used for music/data section callouts
- **Waveform divider** — `<Waveform />` or `.waveform-divider.waveform-animated` — separates narrative blocks
- **Buttons:** `.btn.btn--primary` (dark fill) / `.btn.btn--outline` (bordered)
- **Pill chips:** black fill, cream text, `border-radius: full` — used for tools in project modals

---

## Key component behaviours

### GemstoneGrid (practice heatmap)
- Builds a 365-day grid server-side at build time
- Keys in `practice-log.json` use **local date** (`getFullYear/getMonth/getDate`), NOT `toISOString()` (UTC)
- Practiced days pulse with a pearl-blue gem animation
- `compact={true}` prop used on the About page (two columns)
- Subtitle: `"N active day(s) · updated live as I practice"` — `practiceDaysThisYear` counts keys starting with current year

### CommitGrid (commit heatmap)
- Same grid structure as GemstoneGrid but amber-toned
- Data source: `commit-log.json` (nightly GraphQL sync — matches GitHub profile exactly)
- Intensity scaled per-cell: `--intensity` CSS var drives `color-mix()` on amber
- `activeDays` and `totalCommits` are counted **only within the 365-day window** in `about.astro`

### ProjectModal
- Native `<dialog>` element with `showModal()` / `close()`
- Centered via `position: fixed; inset: 0; margin: auto`
- Entry animation uses `translate` + `scale` CSS properties (NOT `transform`) to avoid fighting centering
- **About body scrolls independently** (`max-height: clamp(180px, 34vh, 320px); overflow-y: auto`)
- Header, tools row, and links footer stay fully visible at all times
- Closes on: X button, backdrop click, Escape key
- Data lives in `shared/content/projects.json` fields: `modal_tools[]`, `modal_about`, `repo`, `link`, `video`

### Dual Timeline (about.astro)
- Two columns: Music (pearl dots) + Data (amber dots)
- **No divider** between columns (removed by user preference)
- Data milestones newest-first in array = top of visual timeline
- Current data milestones as of 2026-05-31:
  ```
  2025–2027  MS Data Science — NYU
  2024       Software Engineer II — Bank of America
  2022       Global Technology Analyst — Bank of America
  2021       Search Data Analyst Intern — Genuine Parts Company
  2020       Vision Driven Data Analyst Intern — Mekong Capital
  2019       Data Analyst Intern — InfoRe Technology
  2018–2022  BA, Quantitative Economics — Dickinson College
  2018       Diploma, Math Specialized Class — Chu Van An High School for the Gifted
  ```

### Proud Moments page
- Page title: "Proud Moments" (not "Moments")
- Nav key in `i18n.json`: `"moments": "Proud Moments"` (EN) / `"Khoảnh Khắc Tự Hào"` (VI)
- Photos live in `mvp-keys/public/images/moments/`
- When `m.image` is null → emoji placeholder renders instead (`🎹` / `💻` / `✨`)

---

## Coding rules for this project

1. **Server-side first** — render data in the Astro frontmatter (`---`), not client-side JS, unless interactivity is truly required.
2. **No new dependencies** — vanilla JS + Astro built-ins only. No npm packages unless Ruby explicitly approves.
3. **Edit, don't rewrite** — always read the file before editing. Make surgical changes.
4. **Use design tokens** — never hardcode colours or spacing. All values via `var(--token-name)`.
5. **Scoped styles by default** — use Astro's scoped `<style>`. Only use `is:global` when styles must apply to JS-created DOM (document.createElement etc.).
6. **Commit messages** — imperative, concise: `fix: …`, `feat: …`, `content: …`, `style: …`, `chore: …`
7. **Always push** — after every commit, push to `main`. The site is live; don't leave uncommitted or unpushed work.
8. **Co-author line** — append to every commit message:
   ```
   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```
9. **Pull before push** — nightly bots commit to `main`. Always `git pull --rebase` if push is rejected.
10. **Check workflows** — after a push, verify deploy succeeded via GitHub Actions API if there's any doubt.
