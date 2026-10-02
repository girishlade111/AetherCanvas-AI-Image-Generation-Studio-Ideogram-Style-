# AetherCanvas — AI Image Generation Studio (Ideogram Style)

A single-file React + TypeScript app: an AI image-generation studio UI inspired by Ideogram. Type a prompt, pick a style preset and aspect ratio, generate images, and browse them in a masonry gallery with prompt history.

## Features

- Prompt-based image generation studio UI (Ideogram-style experience)
- 9 built-in style presets (Photorealistic, Anime, Cyberpunk, Fantasy, Watercolor, Oil Painting, Abstract, Concept Art, and more)
- 6 aspect-ratio options (1:1, 9:16, 3:2, 4:3, 4:5, 16:9)
- Masonry gallery of generated images with prompt history
- Dark/light theme toggle, search over past generations, delete history items
- Anonymous + email Firebase Auth (sign-up / sign-in / sign-out UI)
- Firestore-backed per-user generation history (real-time via onSnapshot)
- 8 bundled dummy placeholders so the UI is explorable without a backend

## Tech Stack

- React 18 + TypeScript (single `index.tsx`)
- Firebase Auth (anonymous + email/password)
- Cloud Firestore (per-user prompt/history documents)
- lucide-react icons
- Custom inline CSS (grid, masonry, animations) injected at runtime

## Quick Start

This repo ships as one self-contained file (`index.tsx`) with no bundler config. To run it:

1. Scaffold a Vite React-TS app and drop `index.tsx` in as the root component:
   ```bash
   npm create vite@latest aether-canvas -- --template react-ts
   cd aether-canvas
   npm install firebase lucide-react
   cp <this-repo>/index.tsx src/App.tsx
   npm run dev
   ```
2. Create a Firebase project and enable Authentication (Anonymous + Email/Password) and Firestore.
3. Replace the `firebaseConfig` object at the top of `index.tsx` with your own project's credentials (the file currently ships with placeholder values).
4. Run `npm run build` and host the `dist/` output on any static host.

## Project Structure

```
├── index.tsx    # Entire app: studio UI, auth, Firestore history, styles
└── README.md    # This file
```

## Notes

- `index.tsx` expects browser globals (`__firebase_config`, `__app_id`) in some hosted environments and falls back to the inline config otherwise.
- Generation itself is a UI shell — wire your preferred image-generation API into the generate handler where the dummy data is produced.

---

**Built by Girish Lade** — https://ladestack.in
