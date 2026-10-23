# PetPal — Grow With Your Habits 🐾

A full-stack individual mini project: a gamified habit tracker where completing real-life habits earns coins and XP for a virtual pet.

## Stack
- Front-end: plain **HTML, CSS and JavaScript** (no React, no build step) in `server/public/`
- Back-end: **Node.js + Express**
- Database: local **JSON file** (`server/src/data/data.json`) — no MongoDB required
- JWT authentication + bcrypt password hashing
- Hand-written SVG bar chart and inline SVG icons (no chart/icon libraries)

## Project structure
```
server/
  public/            ← front-end served by Express
    index.html
    styles.css
    js/app.js        ← UI, routing and state (vanilla JS)
    js/api.js        ← fetch wrapper for /api
    js/chart.js      ← SVG weekly bar chart
    js/icons.js      ← inline SVG icons
  src/
    index.js         ← Express server (API + static files)
    db.js            ← JSON database engine
    models.js        ← data defaults/helpers
    routes/          ← auth, habits, pet, shop, analytics
    data/data.json   ← the database
_backup-react-client/ ← previous React/Vite front-end (reference only)
```

## Features
- Register, log in, log out
- Personal dashboard and virtual pet selection
- Habit CRUD and daily completion
- Server-side rewards with duplicate-claim protection
- Pet XP, levels, happiness and feeding
- Animated pet room with eating, play, sleep, and free petting/cuddle reactions with floating hearts
- Repeat purchases for food; permanent toys/accessories remain owned
- Shop purchases and inventory
- Weekly progress chart and completion history
- Responsive pastel UI

## Requirements
- Node.js 18+ (no database server needed)

## Setup

### 1. Configure the backend
```bash
cd server
cp .env.example .env
```
Edit `.env` and set a long random `JWT_SECRET`. (Optional: `DB_FILE` to store data somewhere other than `src/data/data.json`.)

### 2. Install and run
```bash
npm install
npm run dev
```
Open `http://localhost:5000`. The same server delivers the website and the API (`/api/...`), so there is only one process to run. `npm start` runs it without auto-restart.

## Demo workflow
1. Register a new account.
2. Choose a pet and give it a name.
3. Add habits or use the starter habits.
4. Complete a habit once per day to earn coins and XP.
5. Visit the shop to buy items.
6. View your weekly progress.
7. Visit Pet Care and click **Pet & cuddle · Free** to trigger a heart reaction without spending coins. Feed and Play trigger their own animations.

## Important notes
- Never commit `.env` or real credentials.
- Rewards and purchases are checked by the backend.
- This is a college project starter. Before public deployment, add rate limiting, email verification/password reset, stricter production cookie/token handling, and more automated tests.


## Local JSON database

All app data is stored in a single file: `server/src/data/data.json`. It is created automatically the first time the server starts, and the shop catalogue is filled in from `shopitems.json` if it is empty. The file has one array per collection:

| Key | Contents |
| --- | --- |
| `users` | name, email, bcrypt `passwordHash`, coins |
| `pets` | owner, species, name, happiness, energy, xp, level, inventory (item IDs), equippedItem |
| `habits` | owner, title, description, category, targetMinutes, archived |
| `habitCompletions` | owner, habit, `dayKey` (YYYY-MM-DD), rewards |
| `shopItems` | name, description, category, price, emoji |
| `rewardTransactions` | purchase history |

The database code lives in `server/src/db.js`. Data is kept in memory and saved to disk after every change by writing a temp file and then renaming it, so a crash never leaves a half-written file. `nodemon.json` ignores `src/data/` so saving data does not restart the dev server. To reset everything, stop the server and delete `data.json`.

`sample-habits.json` is example habit data only; habits belong to individual users and are not seeded globally.

To seed or update the shop catalogue manually, run from the `server` directory:

```bash
npm run seed
```

The seed uses an upsert by item name, so running it repeatedly updates existing shop items instead of creating duplicate items.
