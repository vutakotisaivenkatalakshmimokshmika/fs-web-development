# PetPal — Grow With Your Habits 🐾

A full-stack individual mini project: a gamified habit tracker where completing real-life habits earns coins and XP for a virtual pet.

## Stack
- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication + bcrypt password hashing
- Recharts + Lucide React

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
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup

### 1. Configure the backend
```bash
cd server
cp .env.example .env
```
Edit `.env` and set `MONGO_URI` and a long random `JWT_SECRET`.

### 2. Install and run the backend
```bash
npm install
npm run seed
npm run dev
```
The API runs at `http://localhost:5000`.

### 3. Install and run the frontend
Open another terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL printed by Vite (usually `http://localhost:5173`).

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


## Sample data and MongoDB seed

Sample JSON files are stored in `server/src/data/`. The shop catalogue in `shopitems.json` is read by the seed script and inserted into MongoDB using Mongoose. `sample-habits.json` is example habit data only; habits belong to individual users and are not seeded globally.

To seed or update the shop catalogue, make sure MongoDB is running and `server/.env` contains a valid `MONGO_URI`, then run from the `server` directory:

```bash
npm run seed
```

The seed uses an upsert by item name, so running it repeatedly updates existing shop items instead of creating duplicate items. Open MongoDB Compass, connect to `mongodb://127.0.0.1:27017`, select the `petpal` database, then open the `shopitems` collection to view the records.
