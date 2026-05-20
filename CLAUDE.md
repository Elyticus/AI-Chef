# CLAUDE.md — AI-Chef (Kitz Chef)

## Project Overview

Kitz Chef is a full-stack recipe generator that accepts a list of ingredients from the user and returns an AI-generated recipe. The frontend is a React SPA; the backend is a lightweight Express server that proxies requests to the OpenAI API.

- **Frontend (Netlify):** `https://kitzchef.netlify.app`
- **Backend (Render):** `https://kitz-chef.onrender.com`

---

## Repository Structure

```
AI-Chef/
├── public/                  # Static assets (vite.svg)
├── server/
│   └── index.js             # Express server — sole backend entry point
├── src/
│   ├── assets/              # Images (react logo)
│   ├── components/
│   │   ├── Footer/
│   │   │   └── Footer.jsx   # Simple copyright footer
│   │   ├── Main/
│   │   │   └── Main.jsx     # Core component (520 lines) — all recipe logic
│   │   ├── Navbar/
│   │   │   └── Navbar.jsx   # Header + theme toggle (useTheme hook lives here)
│   │   └── Recipe/
│   │       └── Recipe.jsx   # Thin wrapper around react-markdown
│   ├── App.jsx              # Root: renders Navbar (via Main), Main, Footer
│   ├── App.css              # Global styles (747 lines) with light/dark CSS vars
│   └── main.jsx             # React DOM entry point
├── index.html               # HTML shell, loads Inconsolata from Google Fonts
├── package.json
├── vite.config.js
└── eslint.config.js
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 19 (JSX, hooks only — no class components) |
| Build tool | Vite 7 with `@vitejs/plugin-react` |
| Backend framework | Express 5 (ESM `import` syntax) |
| AI provider | OpenAI SDK v6 — model `gpt-4o-mini` |
| Icons | FontAwesome (solid, regular, brands) via `@fortawesome/react-fontawesome` |
| Markdown rendering | `react-markdown` |
| HTTP logging | Morgan (dev only) |
| Styling | Plain CSS3 with CSS custom properties |
| Linting | ESLint 9 with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` |

No TypeScript. No test framework. No state management library (all state is `useState`/`useEffect` in `Main.jsx`).

---

## Environment Variables

The backend reads these from a `.env` file (not committed). No `.env.example` exists yet — variables are:

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | **Yes** | — | OpenAI authentication |
| `FRONTEND_URL` | No | `https://kitzchef.netlify.app` | CORS allowed origin |
| `NODE_ENV` | No | `development` | Enables/disables Morgan logging |
| `PORT` | No | `3001` | Server listen port |

To run locally, create `server/.env` or a root `.env` with at minimum `OPENAI_API_KEY=sk-...`.

---

## Development Workflow

### Install dependencies
```bash
npm install
```

### Run the backend (Express + OpenAI proxy)
```bash
npm run dev        # or: node server/index.js
# Starts on http://localhost:3001
```

### Run the frontend (Vite HMR)
Vite is not wired into any npm script — start it directly:
```bash
npx vite
# Starts on http://localhost:5173
```

> **Note:** The frontend's `fetch` call in `Main.jsx:211` is hardcoded to the production backend URL (`https://kitz-chef.onrender.com`). For local full-stack development, temporarily change this to `http://localhost:3001`.

### Build the frontend for production
```bash
npm run build      # outputs to dist/
npm run preview    # serve the built dist/ locally
```

### Lint
```bash
npm run lint       # runs eslint on all files
```

---

## API

### `POST /api/recipe`

**Request body:**
```json
{ "ingredients": ["chicken", "garlic", "lemon"] }
```
Ingredients must be a non-empty array. They are parsed from a comma-separated textarea string on the client (`parseIngredients` in `Main.jsx:192`).

**Success (200):**
```json
{ "recipe": "## Lemon Garlic Chicken\n..." }
```

**Errors:**
- `400` — `ingredients` is missing, not an array, or empty
- `500` — OpenAI API failure

The OpenAI call uses model `gpt-4o-mini`, temperature `0.7`, with a system prompt of "You are a professional chef. Write clear, practical recipes."

---

## Frontend Architecture

All meaningful logic lives in a single component: **`src/components/Main/Main.jsx`**.

### State
| State variable | Type | Purpose |
|---------------|------|---------|
| `input` | string | Textarea value (comma-separated ingredients) |
| `recipe` | string | Currently displayed recipe (markdown) |
| `loading` | boolean | Disables the submit button during API call |
| `savedRecipes` | array | Recipe history; synced to `localStorage` |
| `activeRecipeId` | string\|null | ID of the recipe shown in the main view |
| `isSidebarExpanded` | boolean | Controls sidebar open/close |

### localStorage keys
| Key | Value |
|-----|-------|
| `savedRecipes` | JSON array of recipe objects |
| `lastActiveRecipeId` | String ID of last-viewed recipe |
| `recipeTheme` | `"light"` or `"dark"` |
| `sidebarExpanded` | Boolean (JSON) |

### Recipe object shape
```js
{
  id: "recipe-<timestamp>",
  content: "<markdown string>",
  preview: "<first 6 words>...",
  dateCreated: "<ISO string>",
  dateInfo: { date, time, fullDateTime, relativeTime },
  isNew: boolean   // transient — set to false after 2 s
}
```

### Theme management
`useTheme` custom hook lives in `Navbar.jsx`. It reads/writes `recipeTheme` from `localStorage` and applies `"light"` or `"dark"` as a class on `document.body`. All color tokens are CSS custom properties in `App.css` that switch based on `body.dark`.

---

## Key Conventions

- **ESM everywhere.** Both frontend and backend use `import`/`export`. `package.json` sets `"type": "module"`.
- **No TypeScript.** Keep changes in `.jsx`/`.js`.
- **No test files.** There is no test runner; ESLint is the only automated quality check.
- **Single-component state.** Do not add Redux, Zustand, or Context unless the component count grows significantly. State lives in `Main.jsx`.
- **CSS only.** No CSS-in-JS, no Tailwind. Add styles in `App.css` using the existing CSS variable naming scheme (`--bg-primary`, `--text-primary`, etc.).
- **localStorage is the only persistence layer.** There is no database.
- **Morgan only in development.** The `!isProduction` guard in `server/index.js` dynamically imports Morgan. Keep this pattern.
- **CORS is strict.** The backend only accepts requests from `FRONTEND_URL`. Do not loosen this without a reason.

---

## Known Limitations / Gaps

- The backend API URL is hardcoded in `Main.jsx:211` — should be an env var (`VITE_API_URL`).
- No rate limiting on `POST /api/recipe`.
- No authentication.
- No test suite.
- No `.env.example` file.
- CORS origin defaults to the production Netlify URL even in development.

---

## Deployment

| Service | Config |
|---------|--------|
| Netlify | Hosts the Vite build (`dist/`). No build config file committed. |
| Render | Runs `node server/index.js` (`npm start`). Needs `OPENAI_API_KEY` env var set in the Render dashboard. |
