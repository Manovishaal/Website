<h1 align="center">MANOVISHAAL // STUDIO</h1>

<p align="center">
  A retro-HUD, cyberpunk-themed personal portfolio for Manovishaal D — Game Developer (Unreal Engine 5, Unity, Godot), Full-Stack Engineer, and Android/VR Developer — complete with a working arcade mini-game.
</p>

<p align="center">
  <img src="screenshots/hero-dark.png" alt="Hero section, dark theme" width="800">
</p>

---

# Overview

This is a single-page portfolio/résumé site built entirely in vanilla HTML, CSS, and JavaScript — no framework, no build step, no backend. It leans hard into a "retro sci-fi HUD" aesthetic: a boot-sequence intro, scanline/CRT overlays, a mouse-reactive constellation canvas background, glitch text, and terminal-style section labels (`// 01`, `// 02`, …). Under the styling is a fully responsive, accessible single-page app: a sticky nav with scroll-spy, a filterable project vault with detail modals, animated skill bars, a reveal-on-scroll timeline, a verified-credentials grid, a contact form, and a self-contained canvas arcade game.

# Tech Stack

| Layer | Technology |
|---|---|
| Markup / Styling | Semantic HTML5, CSS3 (custom properties, Grid/Flexbox, no framework) |
| Behavior | Vanilla JavaScript (ES6+, `IntersectionObserver`, Web Audio API, Canvas 2D) |
| Fonts | Google Fonts — Space Grotesk, Syne, Inter, JetBrains Mono |
| Persistence | `localStorage` (theme preference, arcade high score) |
| Build tooling | None — it's three static files served as-is |

No `package.json`, no dependencies, no bundler. `index.html`, `styles.css`, `main.js`, and `game.js` are the entire application.

---

# Project Setup

```bash
git clone https://github.com/Manovishaal/Website.git
cd Website
```

## Running the Project

Since there's no build step, any static file server works:

```bash
# Option 1 — just open it
open index.html          # macOS
start index.html         # Windows

# Option 2 — serve it locally (recommended for the Web Audio API / clipboard APIs, which some browsers restrict on file://)
npx live-server .
# or
python3 -m http.server 5500
```

Then visit the served URL (e.g. `http://localhost:5500`) — the layout adapts from a full desktop HUD down to a mobile hamburger menu.

## Project Structure

```
Website/
├── index.html        # All markup: nav, hero, about, projects, skills, timeline, certs, contact, modals
├── styles.css         # Full visual system: HUD theme, light/dark tokens, responsive breakpoints
├── main.js             # Canvas background, audio engine, nav, modals, animations, theme toggle, contact form
├── game.js              # Decima Defender — the self-contained arcade mini-game
├── screenshots/           # Screens referenced in this README
├── demo/                    # Demo walkthrough video referenced in this README
└── README.md
```

---

# Demo Video

<video src="demo/website_demo.mp4" controls width="480"></video>

A ~60-second walkthrough: the retro boot sequence, the light/dark theme toggle, the filterable project vault and its detail modal, animated skill bars, the experience timeline, the certifications grid, filling out and submitting the contact form, and a quick round of the built-in Decima Defender arcade game.

---

# Core Features

### Retro Boot Sequence
On load, a terminal-style boot overlay prints a fake system log ("LOADING GAME ENGINE MODULES...", module checks, "PROFILE READY — WELCOME, OPERATOR") before fading out — set the tone in the first three seconds.

### Animated Canvas Background
A `<canvas>` layer renders a mouse-reactive particle field: dozens of glowing points drift and connect with faint lines when close together, gently repelled by the cursor, plus a subtle grid overlay and CRT scanline/vignette effects layered on top.

### Light / Dark Theme Toggle
A single button flips every color token via a `data-theme` attribute and CSS custom properties, with the choice persisted to `localStorage`. The toggle has its own spin animation timed to swap the icon mid-rotation.

### Web Audio Sound Design
An optional audio layer (off by default) synthesizes short tones on the fly with the Web Audio API for hovers, clicks, modal open/close, and toasts — no audio files, just oscillators and gain envelopes.

### Titles Vault — Filterable Projects
Six project cards (Game & VR, Mobile, Web, Data & ML) can be filtered by category. Clicking a card opens a detail modal with the full tech stack, description, and a bulleted list of key systems; the Sitara Apt Portal card also links out to that project's live demo.

### Arsenal Matrix — Animated Skills
Category-grouped skill bars animate to their target percentage the first time the section scrolls into view (via `IntersectionObserver`), backed by a scrolling tech-badge cloud with a randomized glow cycle.

### Mission Logs — Experience & Education Timeline
A scroll-reveal timeline covering work experience and education, each entry in its own HUD-styled panel with tags and dates.

### Verified Credentials
A grid of certification cards (issuer, description, skill tags) for UE5, terrain/environment art, SQL, Excel/data analytics, and Android development.

### Command Center — Contact
A contact panel with clickable email/phone/LinkedIn/GitHub links (each with a one-click copy-to-clipboard button) alongside a validated contact form. Submission is currently simulated client-side with a success toast — see [Notes](#notes) below.

### Arcade Mini-Game — Decima Defender
A fully playable canvas shoot-'em-up reachable from the hero CTA or a floating arcade button (or the Konami code, anywhere on the site: `↑ ↑ ↓ ↓ ← → ← → B A`). Move and fire at Bugs, Viruses, Glitches, and Crashes for points, with levels, particle effects, synthesized sound effects, pause, and a high score saved to `localStorage`.

### Fully Responsive
A collapsing hamburger menu, stacked layouts, and touch-friendly controls (including touch-move support for the arcade game) take the site from a wide desktop HUD down to mobile.

---

# Screens

## Hero — Dark & Light Themes
<img src="screenshots/hero-dark.png" alt="Hero, dark theme" width="700">
<img src="screenshots/hero-light.png" alt="Hero, light theme" width="700">

The animated telemetry counters (Engine Mastery, Projects Shipped, Certs Verified, Years Building) count up on scroll; the theme toggle swaps every token instantly.

## Studio Briefing (About)
![About](screenshots/about.png)

## Titles Vault (Projects)
![Projects grid](screenshots/projects-grid.png)

## Project Detail Modal
![Project modal](screenshots/project-modal.png)

## Arsenal Matrix (Skills)
![Skills](screenshots/skills.png)

## Mission Logs (Experience & Education)
![Experience timeline](screenshots/experience.png)

## Verified Credentials (Certifications)
![Certifications](screenshots/certifications.png)

## Command Center (Contact)
![Contact](screenshots/contact.png)

## Arcade — Decima Defender
<img src="screenshots/arcade-idle.png" alt="Decima Defender attract screen" width="700">
<img src="screenshots/arcade-playing.png" alt="Decima Defender gameplay" width="700">

## Mobile Navigation
<img src="screenshots/mobile-menu.png" alt="Mobile hamburger menu" width="320">

---

# Notes

- The contact form validates input and shows a success toast, but submission is currently simulated client-side (see the comment in `main.js`: *"Simulate submission (replace with real backend/emailJS/formspree)"*). Wiring it to EmailJS, Formspree, or a real backend would make it functional.
- Sound effects are off by default (toggle in the nav) since autoplaying audio is broadly restricted by browsers until a user gesture occurs.

# Roadmap

- Connect the contact form to a real email/backend service.
- Add project screenshots/GIFs directly into each modal.
- Expand the arcade game with additional enemy waves and a shareable leaderboard.

---

<p align="center">Built by Manovishaal D — Coimbatore, Tamil Nadu, India.</p>
