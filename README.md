# Tweet Testimonials Admin

Internal tool for NFTfi marketing to manage tweet-based testimonials. Authenticated staff can add, edit, reorder, and delete testimonials, then export a bundle (ZIP) for developers to commit into the main SPA repo.

## Running locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy `.env.example` to `.env` and set:

   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (OAuth 2.0 Client ID for a Web application).
   - `NEXTAUTH_SECRET` – e.g. `openssl rand -base64 32`.
   - `NEXTAUTH_URL` – `http://localhost:3000` for local dev.
   - `DATABASE_URL` – optional; defaults to `file:./data/testimonials.db`.
   - `UPLOAD_DIR` – optional; defaults to `./data/uploads` (avatar images).

3. **Database**

   The SQLite DB and tables are created automatically. To apply schema changes:

   ```bash
   npm run db:push
   ```

4. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Google OAuth and @nftfi.com restriction

- Create a OAuth 2.0 Client ID (Web application) in Google Cloud Console.
- Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (and your production URL when deployed).
- Only users with an email ending in `@nftfi.com` can sign in; others are rejected at the sign-in step.

## How marketing exports a bundle

1. Sign in with Google (@nftfi.com).
2. On the dashboard, click **Export testimonials bundle**.
3. A ZIP file is downloaded (e.g. `nftfi-testimonials-YYYYMMDD-HHMM.zip`).
4. Give this ZIP to developers so they can commit the contents into the main website repo.

## Where devs place files in the main SPA

After extracting the export ZIP:

- **`data/testimonials.json`** → put in the main SPA as **`src/data/testimonials.json`** (or **`public/data/testimonials.json`**, depending on how the SPA serves static data).
- **`public/tweets/avatars/*`** → put in the main SPA under **`public/tweets/avatars/`** (so that `profileImage` paths like `/tweets/avatars/1.jpg` resolve correctly).

The export ZIP is structured so that extracting it into the repo root yields the correct paths above.

## Script for main SPA (optional)

In the main SPA repo you can add a small script that copies from an extracted export folder into the final locations, e.g.:

```bash
# Example: copy from extracted zip folder into SPA
cp -r path/to/extracted/data/testimonials.json src/data/
mkdir -p public/tweets/avatars
cp path/to/extracted/public/tweets/avatars/* public/tweets/avatars/
```

## Tech stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- Auth.js (NextAuth) with Google provider, restricted to @nftfi.com
- Drizzle ORM + SQLite (better-sqlite3)
- React Hook Form + Zod for forms
- Export: JSON + ZIP with avatars generated on demand
