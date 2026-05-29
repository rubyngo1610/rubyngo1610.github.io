# KEY_MAP.md — Keys of Proof

One-octave piano (C4–C5, 13 keys). **White = music. Black = data.**

Owner edits key content in `src/components/PianoHero.astro` — search for the `WHITE_KEYS` and `BLACK_KEYS` arrays at the top of the script.

---

## White keys (music)

| Key | Note | Current title        | Content / link                                     |
|-----|------|----------------------|----------------------------------------------------|
| 1   | C4   | Origin               | Dickinson BA — QE + Music → `/about`               |
| 2   | D4   | Carnegie Hall        | Concert debut, one-liner → `/music`                |
| 3   | E4   | NY Piano Society     | Community concerts → `/music`                      |
| 4   | F4   | [Proud moment 1]     | **OWNER fills in** → `/moments`                    |
| 5   | G4   | Listen               | Featured recording embed → `/music`                |
| 6   | A4   | [Proud moment 2]     | **OWNER fills in** → `/moments`                    |
| 7   | B4   | Repertoire           | Romantic era, piece count → `/music`               |

## Black keys (data)

| Key | Note | Current title         | Content / link                                    |
|-----|------|-----------------------|---------------------------------------------------|
| 1   | C#4  | FINRA-Scale Impact    | 100M+ records, compliance pipeline → `/projects`  |
| 2   | D#4  | SnapEat               | Google AI Hackathon → `/projects`                 |
| 3   | F#4  | Copyright Laundering  | Agentic AI research → `/projects`                 |
| 4   | G#4  | Research              | Uganda lockdowns econometrics → `/projects`       |
| 5   | A#4  | [Proud moment 3]      | **OWNER fills in** → `/moments`                   |
| 6   | C#5  | Stack & Skills        | Tools list → `/skills`                            |

## High C (CTA key)

| Key | Note | Title      | Action                      |
|-----|------|------------|-----------------------------|
| 13  | C5   | Let's talk | Links to `/contact`         |

---

## Algorithm — Gemstone Piano view

The `GemstonePiano` component maps practice sessions to keys using:

```
keyIndex = (dayOfMonth - 1) mod 13
```

**Example:** A session on the 14th of any month → key index `(14-1) mod 13 = 0` → C4.

To change the mapping algorithm, edit `src/components/GemstonePiano.astro` line ~40.

---

## How to edit key content

1. Open `mvp-keys/src/components/PianoHero.astro`
2. Find `const WHITE_KEYS_DATA` and `const BLACK_KEYS_DATA` in the `<script>` block
3. Edit `title`, `body`, and `link` for the key you want to update
4. **Also update** the matching entry in the `WHITE_KEYS` / `BLACK_KEYS` arrays in the frontmatter (top of file) — these are used for SSR rendering and accessibility
5. Save and rebuild

Both arrays must stay in sync. The frontmatter arrays are used for server-rendered HTML; the script arrays are used for client-side card display.

---

## Physical piano layout reference

```
  [C#] [D#]     [F#] [G#] [A#]     [C#5]
 C   D   E   F   G   A   B   C5
```

Black key positions in CSS (`key--black-N` classes) correspond to:
- `key--black-0` = C#4 (between C4 and D4)
- `key--black-1` = D#4 (between D4 and E4)
- `key--black-2` = F#4 (between F4 and G4, skipping E4–F4 gap)
- `key--black-3` = G#4 (between G4 and A4)
- `key--black-4` = A#4 (between A4 and B4)
- `key--black-5` = C#5 (between B4 and C5)
