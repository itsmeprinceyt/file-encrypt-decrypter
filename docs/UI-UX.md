# File Encrypter Decrypter — UI/UX & Brand Spec

Current state of the app's interface, its exact colour palette, and a complete brief for
producing a new logo that matches it. Everything here describes the code that exists today
(`src/app/**`, `src/app/globals.css`, `electron/main.ts`).

---

## 1. Product overview

- **What it is:** a local-first Windows desktop app (Electron + Next.js static export) that
  encrypts and decrypts one file at a time using AES-256-GCM, a passphrase and a separate
  Recovery Key.
- **Platform:** Electron only. Window opens maximized on Windows.
- **Tone:** calm, trustworthy, minimal, single-purpose. No marketing hero, no header, no
  footer, no accounts, no uploads.
- **Design principles**
  1. One decision per screen — the user always has exactly one primary action.
  2. Quiet surfaces: white cards on a pale green-grey canvas, thin borders, almost no shadow.
  3. Colour is reserved for meaning: teal = action/success, amber = caution, red = error.
  4. Text is the interface; no icons except a few single-character glyphs (`↑`, `↓`, `✓`, `!`).

---

## 2. Colour palette

Single light theme (`color-scheme: light`). CSS custom properties are declared in
`src/app/globals.css`:

```css
:root {
  color-scheme: light;
  --ink: #172321;
  --muted: #71807b;
  --line: #e2e9e6;
  --surface: #ffffff;
  --canvas: #f5f8f6;
  --accent: #147d68;
  --accent-dark: #0f6655;
}
```

### 2.1 Core palette

| Token | Hex | Where it is used |
| --- | --- | --- |
| Canvas | `#F5F8F6` | App background |
| Surface | `#FFFFFF` | Cards, inputs, quiet buttons, recovery-key block |
| Panel tint | `#F8FAF9` | Recovery-key section background |
| Ink | `#172321` | Primary text, headings |
| Muted | `#71807B` | Secondary text, captions, paths, "Cancel"/"Return home" |
| Subtle | `#899590` | Placeholder text, quietest helper line, disabled button text |
| Secondary text | `#53645E` | Small field labels |
| Border | `#E2E9E6` | Card borders, dividers, quiet-button borders |
| Border (input) | `#DCE5E1` | Input borders, quiet-button borders |
| Accent | `#147D68` | Primary buttons, success text, focus accent, checkboxes, progress fill |
| Accent hover | `#0F6655` | Primary button hover |
| Accent soft | `#E8F4F0` | Icon chip background, success check circle |
| Neutral chip | `#EEF1EF` | Decrypt card icon chip |
| Track | `#EDF1EF` | Progress/password-strength track, disabled button fill |

### 2.2 Semantic colours

| Meaning | Background | Border | Text | Usage |
| --- | --- | --- | --- | --- |
| Warning / info | `#FBF7EF` | `#EADFC9` | `#765B2B` | Recovery-key caution, legacy-format notice |
| Error | `#FFF7F5` | `#F0D2CE` | `#9B443B` | Inline error panels, field errors |
| Success | — | — | `#147D68` | "Copied…", "Recovery key verified." |

### 2.3 Password-strength ramp

| Length | Colour |
| --- | --- |
| 0 | transparent |
| 1–11 | `#C65A50` |
| 12–15 (minimum) | `#C58A2B` |
| 16–23 | `#299780` |
| 24+ | `#147D68` |

Track is `#EDF1EF`; the bar is `height: 6px` (Tailwind `h-1.5`), fully rounded.

### 2.4 Transparency / overlays

| Use | Value |
| --- | --- |
| Text selection | `rgb(20 125 104 / 16%)` |
| Focus ring | `3px solid rgb(20 125 104 / 20%)`, `outline-offset: 2px` |
| Card shadow | `0 12px 40px rgba(18, 53, 43, 0.05)` |
| Home-card hover shadow | `0 12px 32px rgba(18, 53, 43, 0.07)` |

### 2.5 Contrast notes (approximate, WCAG 2.1)

| Pair | Ratio | Verdict |
| --- | --- | --- |
| `#172321` on `#F5F8F6` | ≈ 13.9:1 | AAA |
| `#172321` on `#FFFFFF` | ≈ 15:1 | AAA |
| `#FFFFFF` on `#147D68` | ≈ 5.0:1 | AA normal text, AA UI |
| `#147D68` on `#FFFFFF` | ≈ 5.0:1 | AA normal text |
| `#71807B` on `#FFFFFF` | ≈ 4.1:1 | Only for supporting copy (below AA for body) |
| `#9B443B` on `#FFF7F5` | ≈ 6.0:1 | AA |

### 2.6 Palette legacy leftovers (not visible in the current UI)

`Loader.tsx` and `Side.tsx` are **not imported anywhere**, but they still use the old
blue theme: `from-blue-900`, `to-blue-950`, `text-blue-100`, `border-blue-500`,
`text-shadow-blue-100`, plus `cursor-default` on a clickable element. If either component is
ever revived, restyle it with this palette (canvas `#F5F8F6`, accent `#147D68`, ink `#172321`)
instead of shipping the old blues.

---

## 3. Typography

- **Family:** `Arial, Helvetica, sans-serif` (no web fonts, no letter-spacing tricks).
- **Rendering:** `-webkit-font-smoothing: antialiased` on `<body>`.
- **Weights used:** 400 (body), 500 (medium labels/buttons), 600 (semibold headings).
- **Monospace:** `font-mono` for the recovery key and `.key` snippets (`select-all`).

| Role | Size / weight |
| --- | --- |
| Home title ("Your files, kept private.") | 30px → 36px at `sm`, 600 |
| Screen heading (Encrypt/Decrypt/Done) | 24px, 600 |
| Card heading (inside a screen) | 18px, 600 |
| Section subheading ("Recovery key") | 14px, 500 |
| Body / button label | 14px |
| Field label | 12px, 500 |
| Helper, path, error text | 12–14px |
| Logo caption (legacy components) | 12px, 200 |

---

## 4. Layout & spacing system

```
┌──────────────────────────────────────────────────────────────┐
│  canvas #F5F8F6   px-6 py-7  (sm: px-10)                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  max-w-5xl, centred, min-h = 100vh − 3.5rem            │  │
│  │                                                        │  │
│  │                    (vertically centred)                │  │
│  │              Title / screen heading                    │  │
│  │              ─────────────────                        │  │
│  │         Home: max-w-2xl, 2-up card grid                │  │
│  │         Encrypt/Decrypt: card max-w-lg                 │  │
│  │         Done: card max-w-lg, centred text              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

- **Outer padding:** 24px top/bottom, 24px sides (40px sides from `sm`).
- **Content column:** `max-width: 1024px` (`max-w-5xl`), centred, `display: flex; column`.
- **Vertical rhythm:** title block `margin-bottom: 28px`; stacks use `gap: 20px`
  (`gap-5`).
- **Card radii:** 16px (`rounded-2xl`) for screen/home cards, 12px (`rounded-xl`) for the
  recovery-key panel and icon chips, 8px (`rounded-lg`) for buttons/inputs, full for progress
  bars and the success circle.
- **Card borders:** 1px `#E2E9E6`.
- **Card padding:** 24px, 32px from `sm`.
- **Home grid:** 2 columns from `sm`, `gap: 16px`.
- **Inputs:** 1px `#DCE5E1`, 8px radius, 14px text, 10px×14px padding.
- **Recovery-key block:** `#F8FAF9` panel, 16px padding, 12px radius, 12px monospace key,
  `break-all`, `select-all`.

---

## 5. Screens & flow

State machine in `src/app/page.tsx`:

```
home ──Encrypt card──► encrypt ──success──► done ──Return home──► home
  └───Decrypt card──► decrypt ──success──► done
                        └─ Cancel ─► home
```

Titles per screen: `home` → "Your files, kept private.", `encrypt` → "Encrypt a file",
`decrypt` → "Decrypt a file", `done` → "All done".

### 5.1 Home

- 30/36px semibold title: **Your files, kept private.**
- 14px muted line: "Protect a file with a passphrase and a separate recovery key."
- Two equal cards (max 2xl grid):
  - **Encrypt a file** — soft-teal chip with `↑`, 16px semibold label, 14px muted copy:
    "Create a protected .prince file with two-factor recovery."
  - **Decrypt a file** — neutral chip with `↓`, copy: "Restore a file using its passphrase
    and recovery key."
  - Both: white, 16px radius, 1px border, 24px padding, left-aligned; hover = accent border
    + soft shadow.
- 12px subtle footer line: "No accounts. No uploads. Encryption happens on your device."

### 5.2 Encrypt a file

Card (max-w-lg) sections, top to bottom:

1. Heading + muted subline ("Choose a file and set both recovery factors.").
2. **File picking:** full-width quiet button "Choose file", path line under it (12px muted,
   `break-all`, "No file selected" when empty); quiet button "Choose save location"
   (disabled until a file is chosen), output path line.
3. **Passphrase:** label, password input ("At least 12 characters"), 6px strength bar, label,
   confirm password input, inline red hints for "Use at least 12 characters." and
   "Passphrases do not match."
4. **Recovery key panel** (`#F8FAF9`): heading + explanation, **Generate** (small solid
   accent button). After generation: monospace key block (selectable), amber caution line,
   "Copy key" / "Save .key file" quiet buttons, and a checkbox **I have saved my recovery key**.
5. Inline feedback (success green / error panel) and a progress bar while busy
   ("Encrypting…", percentage right-aligned).
6. Primary button **Encrypt file** — solid `#147D68`, white text; disabled until file + output
   path + valid matching passphrase + generated & acknowledged recovery key; disabled style =
   `#EDF1EF` fill, `#899590` text, `cursor: not-allowed`.
7. Centred text link **Cancel** → home.

### 5.3 Decrypt a file

Same card skeleton. Differences:

- Button reads "Choose .prince file"; non-`.prince` selections produce an error.
- File format is inspected: version 2 → passphrase + Recovery Key fields; version 1 (legacy)
  → amber notice and a single "Original password" field.
- Recovery key validates as you type (250 ms debounce): red "Recovery key checksum does not
  match." or green "Recovery key verified."
- Primary **Decrypt file** disabled until inputs are valid; busy label "Decrypting…".

### 5.4 All done

Centred card (max-w-lg, 32px padding, text-center):

- 48px soft-teal circle with `✓`.
- 18px semibold message ("Your file is encrypted." / "Your file is decrypted.").
- Optional amber notice panel (legacy-format advice).
- Full-width **Show in folder** primary button → reveals the saved file in Explorer
  (Windows: `explorer.exe /select,<path>` from the main process, so it comes to the front).
- Inline red error panel if the location can no longer be opened.
- Centred text link **Return home** (clears the stored folder path).

---

## 6. Interaction, states & cursor

- **Hover:** primary buttons darken to `#0F6655`; quiet buttons get `#F6F9F7`; home cards get
  accent border + shadow; text links go from muted to ink.
- **Focus-visible:** 3px teal ring at 20% opacity with 2px offset (buttons and inputs).
- **Disabled:** fill `#EDF1EF`, text `#899590`, no hover, `cursor: not-allowed`.
- **Cursor rule (global):** every enabled `button`, `summary` and `[role="button"]` uses
  `cursor: pointer`; disabled buttons use `not-allowed`.
- **Motion:** colour/shadow transitions ≈150 ms; the strength bar animates width over 300 ms.
  No entrance animations, no spinners, no skeletons.
- **Keyboard shortcuts (main process):** `Ctrl + E` encrypt, `Ctrl + D` decrypt, `Ctrl + H`
  home; `Ctrl + =` / `Ctrl + -` / `Ctrl + 0` zoom. App menu offers About, Shortcuts, Reload,
  Zoom, Fullscreen, Quit.
- **Feedback:** errors appear inline in the card (`role="alert"`); nothing is a toast or
  modal.
- **Accessibility details:** icon glyphs are `aria-hidden`, images have `alt="Logo"`, inputs
  are bound to labels via `htmlFor`, decorative chips are non-interactive.

---

## 7. Logo & brand assets

### 7.1 Current logo (to be replaced)

A dark navy rounded "document" shape with a folded corner, overlaid by a shield outline in
mid-blue, containing a padlock whose keyhole is a blue key. Smooth glossy shading, blue
gradient accents (`#2F80D8`-ish blue on `#121B24`-ish navy). It is the last piece of the old
blue brand and now clashes with the teal palette.

Effective palette of the current mark: navy `#101820`–`#1E2B38`, blue `#2F86E0` /
`#1E5FAE`, neutral grey `#9AA6B2`, white highlights.

### 7.2 Where the logo is actually used

| Asset | Size / format | Used by |
| --- | --- | --- |
| `electron/assets/logo.ico` | ICO, single 256×256 frame | Electron `BrowserWindow` icon (`electron/main.ts`), electron-builder `win.icon` (installer/portable) |
| `src/assets/logo.ico` | ICO, 256×256 | Legacy copy, not referenced |
| `src/assets/logo-png.png` | PNG 1024×1024 RGBA | `Loader.tsx` (Suspense fallback) and `Side.tsx` — **both unused today** |
| `src/assets/logo.png` | PNG 1024×1024 RGBA | Unreferenced |
| `src/assets/tick.png` | PNG 512×512 RGBA | Unreferenced (success uses a CSS `✓`) |

Important: the current UI shows **no logo inside the window** (the header and footer were
deliberately removed). The mark appears only as the window/taskbar icon and in the
installer/shortcut icon.

### 7.3 Brief for the new logo (hand this to the design AI)

**Goal:** redraw the existing mark in the new palette — same concept (file + shield + lock,
i.e. "a protected file"), new colour. Keep it recognisable, simpler, and legible at 16 px.

**Shape & composition**
- Keep the document silhouette (rounded rectangle with a folded top-right corner) and the
  shield/lock motif inside it.
- Reduce glossy gradients: at most one subtle gradient per surface; flat, calm, modern.
- No text, no letters, no monogram, no "prince".
- Centred composition with ~8–10% transparent padding on all sides so it survives Windows
  icon masks and small taskbar sizes.
- Full-bleed background is optional; prefer a transparent background over white. If a
  background tile is used, make it a rounded square with `#F5F8F6` or a soft teal.

**Colour mapping (required — use these exact values)**

| Element | Colour |
| --- | --- |
| Document body / primary shape | `#172321` (ink) with a subtle lift to `#22332F`, or `#FFFFFF` on a teal tile |
| Document fold / secondary surface | `#2A3B36` (ink + ~8% white) |
| Shield outline | `#147D68` (accent), gradient allowed `#1F9C82` → `#0F6655` |
| Shield inner fill | `#E8F4F0` (accent soft) when the shield sits on the dark document |
| Padlock body | `#147D68`, shackle `#0F6655` |
| Keyhole / key | `#F5F8F6` (canvas) on teal, or `#147D68` on light surfaces |
| Small highlight | `#FFFFFF` at ≤25% opacity only |
| Background tile (optional) | `#F5F8F6` canvas or `#147D68` accent |

Avoid: the old blues (`#2F86E0`, `#1E5FAE`, `#121B24` navy), purple, gradients that shift
hue, pure black, drop shadows with blur > 4 px.

**Small-size legibility**
- It must still read as "document + shield" at 16×16 and 32×32: thicker shield stroke
  (≥ 6% of canvas width), keyhole reduced to a solid dot + slot if necessary, no thin
  gloss lines, no detail inside the fold.
- Keep roughly 2:1 contrast between the shield and the document at small sizes; do not rely
  on hue alone — use the light-on-dark or dark-on-teal relationship.

**Deliverables and file specs**

| File to produce | Format | Size | Notes |
| --- | --- | --- | --- |
| `src/assets/logo-png.png` | PNG, RGBA, transparent | 1024×1024 | Primary master shown by `Loader.tsx` / `Side.tsx` at 400–500 px |
| `src/assets/logo.png` | PNG, RGBA, transparent | 1024×1024 | Same artwork, kept in sync |
| `src/assets/logo.ico` | ICO, multi-size | 16, 24, 32, 48, 64, 128, 256 | Windows-ready |
| `electron/assets/logo.ico` | ICO, multi-size | same as above | The one Electron and electron-builder actually use |
| `src/assets/tick.png` | PNG, RGBA, transparent | 512×512 | Optional refresh: same accent + canvas check mark |

**Acceptance checklist**
- [ ] Palette contains only the values in section 2 (plus white transparency).
- [ ] Mark reads at 16 px on both light and dark taskbars.
- [ ] Transparent padding consistent on all sides; no clipped edges.
- [ ] `electron/assets/logo.ico` contains all listed sizes (not just 256).
- [ ] After replacing files run `npm run build:electron` (copies assets) and
      `npm run build:app` (rebuilds installer/portable with the new icon).
- [ ] No old blue pixels remain in any logo asset.

---

## 8. Quick reference for implementers

- Palette lives in `src/app/globals.css` (`:root` variables); components currently use
  literal hex values, so keep new work consistent with the table above.
- Screen state is in `src/app/page.tsx`; components are under `src/app/(components)/`.
- Primary action = one solid teal button per screen. Everything else is a white quiet button
  with a thin border, or a muted text link.
- Never add a header, footer, sidebar, toast system, or dark mode without being asked.
