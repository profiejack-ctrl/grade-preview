# GradePulse — Vercel & Neon Production Deployment Guide

This project is now fully configured for production deployment on **Vercel** with a serverless **Neon PostgreSQL** database.

---

## Architecture Summary

| Component | Technology | Production (Vercel) | Local Development |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 19 + Vite + Tailwind CSS | Static CDN (`dist/`) | `http://localhost:3000` |
| **API Endpoints** | Express on Vercel Serverless Functions | `/api/*` via `api/index.js` | `http://localhost:3001` |
| **Database** | Serverless SQL Layer | **Neon PostgreSQL** (via `@neondatabase/serverless`) | **SQLite** (`data/grades.sqlite`) or Neon |
| **Configuration** | `vercel.json` | Automatic SPA + Serverless routing | Vite proxy to port 3001 |

---

## Step 1: Create Your Free Neon Database (2 Minutes)

1. Go to [https://neon.tech](https://neon.tech) and sign up / log in with GitHub or Google.
2. Click **Create Project**:
   - **Name**: `gradepulse` (or any name)
   - **Postgres version**: `16` or `17` (default)
   - **Region**: Choose the closest region (e.g., `Singapore / ap-southeast-1` or `US East`).
3. Once created, your dashboard will display your **Connection Details**:
   - Select **Connection string**
   - Click **Copy** (it looks like):
     ```text
     postgresql://neondb_owner:npg_xxxxxxxxxxxx@ep-cool-cloud-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```

> **Automatic Schema Setup**: You do **not** need to run any manual SQL queries in Neon! When the app boots on Vercel, it automatically creates the `subjects` and `student_grades` tables and seeds them with `IPT101`, `ITE1`, and `MS102`.

---

## Step 2: Deploy to Vercel

You can deploy using either the **Vercel Web Dashboard (GitHub)** or the **Vercel CLI**.

### Option A: Via GitHub & Vercel Dashboard (Recommended)

1. Commit and push your code to your GitHub account:
   ```bash
   git add .
   git commit -m "Configure Vercel production with Neon PostgreSQL"
   git branch -M main
   # Link to your new GitHub repository:
   git remote add origin https://github.com/<your-username>/grades-viewer.git
   git push -u origin main
   ```
2. Go to [https://vercel.com/new](https://vercel.com/new).
3. Import your `grades-viewer` repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - **Key**: `DATABASE_URL`
   - **Value**: *(Paste your Neon connection string from Step 1)*
6. Click **Deploy**.

---

### Option B: Via Vercel CLI (Direct from Terminal)

Run from your project folder:
```bash
npx vercel
```
1. Follow the terminal prompts to link your account.
2. Add your Neon connection string:
   ```bash
   npx vercel env add DATABASE_URL production
   ```
   *(Paste your Neon connection string when prompted)*
3. Deploy to production:
   ```bash
   npx vercel --prod
   ```

---

## Step 3: Test Neon Locally (Optional)

If you want your local machine to test against Neon instead of SQLite:
1. Create a `.env` file in the project root:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_xxxxxxxxxxxx@ep-cool-cloud-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```
2. Start the local server:
   ```bash
   npm run server
   ```
   The terminal will output:
   ```text
   GradePulse API server listening on http://0.0.0.0:3001 [Database: Neon PostgreSQL]
   ```
   The Faculty dashboard badge will automatically display **"Neon Database"**.
