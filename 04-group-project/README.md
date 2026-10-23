# Verifi — Institutional Achievement Management System            live: http://hack-arena-gilt.vercel.app

Role-based web app for tracking, verifying, and reporting student and faculty achievements (publications, certifications, internships, workshops, hackathons, patents, sports, cultural events, etc.).

Tech stack: React (Vite) • Tailwind CSS • Firebase (Auth + Firestore) • jsPDF + SheetJS for exports

## Contents

- Project summary
- Quickstart (install, run)
- Firebase setup and config
- Scripts and development workflow
- Folder structure and key files
- Deployment
- Troubleshooting & notes

---

## Quick summary

- Role-based authentication (student / faculty / admin)
- Record submission across multiple achievement categories
- Admin verification workflow (approve / reject)
- Search, filtering and analytics dashboard
- Export reports to PDF and Excel

---

## Prerequisites

- Node.js 16+ and npm
- Firebase account and a Firebase project

---

## Quickstart — Local development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

---

## Available scripts

The project scripts are defined in `package.json`:

- `npm run dev` — starts Vite dev server
- `npm run build` — builds production assets (output: `dist/`)
- `npm run preview` — locally preview the production build
- `npm run lint` — runs the configured linter (`oxlint`)

---

## Firebase setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication → Sign-in method → Email/Password
3. Create a Firestore database (choose production or test mode as appropriate)
4. Add a Web app in Project Settings and copy the config object
5. Add the config to this project:

Option A (recommended): Use environment variables with Vite. Create a `.env.local` in the project root with values like:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Then update `src/firebase.js` to read from `import.meta.env.VITE_FIREBASE_*` (the project already contains `src/firebase.js` — replace the placeholder values).

Option B: Paste the Firebase config directly into `src/firebase.js` (less secure for public repos).

6. Firestore rules: open `firestore.rules` in the repo and publish them in the Firebase Console (Firestore → Rules). These rules enforce role-based access; confirm the `users` collection contains correct `role` fields for test accounts.

---

## Creating an admin account

By default, the UI registers student/faculty accounts only. To make a user an admin:

1. Register via the app UI.
2. In Firebase Console → Firestore → `users` collection, find the user's document and change the `role` field to `admin`.

---

## Exports (PDF & Excel)

- Exports are implemented in `src/utils/export.js`. The UI provides filtered exports respecting current filters and selected records.
- Excel export uses the `xlsx` package and PDF exports use `jspdf` + `jspdf-autotable`.

---

## Project structure (key files)

```
src/
├─ firebase.js               # Firebase initialization (replace with your config or use env vars)
├─ App.jsx                   # App routes and protected route wrappers
├─ main.jsx                  # React entry
├─ context/AuthContext.jsx   # Auth state, user profile and role management
├─ services/
│   ├─ authService.js        # register / login / logout
│   └─ achievementService.js # CRUD + queries + analytics helpers
├─ utils/export.js           # PDF + Excel export helpers
├─ components/
│   ├─ Navbar.jsx
│   └─ StatusBadge.jsx
└─ pages/
    ├─ Login.jsx
    ├─ Register.jsx
    ├─ RecordDashboard.jsx     # student / faculty submission + own records
    └─ AdminDashboard.jsx      # verification, filters, analytics, export
```

---

## Build & Deploy (Firebase Hosting)

1. Install Firebase CLI (if needed):

```bash
npm install -g firebase-tools
firebase login
```

2. Build and deploy:

```bash
npm run build
firebase deploy --only hosting
```

Notes:
- This project ships a `firebase.json` configured to serve the `dist/` folder as an SPA with proper rewrites.
- If this is your first time deploying, run `firebase init hosting` and choose the existing project (do not overwrite the repo files unless you intend to).

---

## Troubleshooting

- "Missing or insufficient permissions": ensure `firestore.rules` is published and that test users have the correct `role` in their user doc.
- "The query requires an index": follow the link printed by the Firestore error to create the index in the Firebase Console.
- Blank page after deploy: confirm the SPA rewrite is present in `firebase.json` and `dist/index.html` exists.

---

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repo
2. Create a feature branch
3. Add tests / manual verification steps
4. Open a pull request with a clear description

---

## License

Specify a license for your project (e.g., MIT). This repo does not include a license file by default — add one if you plan to open source the code.

---

If you'd like, I can add badges, usage screenshots, or tailor the README to include sample env values and a suggested `src/firebase.js` snippet that reads from `import.meta.env`.
