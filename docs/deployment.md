# Deployment Guide

## Recommended Free Demo Stack

For a zero-cost teacher demo, the most practical setup for this repo is:

- Frontend: Vercel Hobby
- Backend: Render Free web service
- Database: Neon Free Postgres

This combination keeps the Next.js frontend simple, supports inbound WebSockets on the backend, and avoids the 30-day expiry of Render Free Postgres.

Do not treat this stack as production-ready infrastructure. It is excellent for demos, portfolio reviews, and short-lived showcases.

## Why this stack

- Vercel Hobby is free forever for personal projects and is the easiest place to host this Next.js frontend.
- Render Free web services support inbound WebSockets, which this app needs for chat, code sync, and signaling.
- Neon Free Postgres has no time limit and is a better fit than Render Free Postgres for a reusable demo database.
- Railway is no longer a truly free long-term option. Its official pricing is now a one-time $5 trial credit for 30 days.

## Step 0: Put the repo on GitHub

Vercel and Render are simplest when both deploy from the same GitHub repository.

1. Create a GitHub repository.
2. Upload this project.
3. Make sure the repository includes:
   - `frontend/vercel.json`
   - `render.yaml`
   - `backend/Dockerfile`

## Step 1: Create the free Neon database

1. Sign up at `https://console.neon.tech/`.
2. Create a new project.
3. In the Neon dashboard, copy:
   - JDBC connection string
   - Username
   - Password
4. Save them for the backend environment variables.

Use the JDBC URL that Neon shows in its dashboard. It already includes the safest connection details for hosted access.

## Step 2: Deploy the backend on Render Free

1. Sign up at `https://dashboard.render.com/`.
2. Choose `New` -> `Blueprint`.
3. Point Render at the GitHub repository root.
4. Render will detect [render.yaml](../render.yaml), which is now configured for the free web-service plan.
5. Fill these environment variables in the Render dashboard:

```text
JWT_SECRET=<generate-a-long-random-secret>
JWT_EXPIRATION_MINUTES=180
APP_CORS_ALLOWED_ORIGINS=https://your-frontend-project.vercel.app
APP_FRONTEND_URL=https://your-frontend-project.vercel.app
APP_SEED_DEMO_DATA=true
SPRING_DATASOURCE_URL=<jdbc-url-from-neon>
SPRING_DATASOURCE_USERNAME=<username-from-neon>
SPRING_DATASOURCE_PASSWORD=<password-from-neon>
```

6. Deploy and wait for the health check at `/api/health` to pass.
7. Copy the final backend URL, for example `https://mentora-backend.onrender.com`.

Helpful command to generate `JWT_SECRET` locally:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Deploy the frontend on Vercel Hobby

1. Sign up at `https://vercel.com/`.
2. Import the same GitHub repository.
3. Set the project Root Directory to `frontend`.
4. Add these environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_WS_URL=https://your-backend.onrender.com/ws
NEXT_PUBLIC_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
NEXT_PUBLIC_TURN_URLS=
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_CREDENTIAL=
```

5. Deploy.
6. Copy the production frontend URL, for example `https://mentora.vercel.app`.

The repository includes [vercel.json](../frontend/vercel.json) for the correct install and build commands.

## Step 4: Reconnect frontend and backend

After Vercel gives you the real frontend URL:

1. Go back to Render.
2. Update:
   - `APP_CORS_ALLOWED_ORIGINS`
   - `APP_FRONTEND_URL`
3. Redeploy the backend if Render does not do it automatically.

If you changed the backend URL at any point, also update the two frontend env vars in Vercel and redeploy the frontend.

## Step 5: Smoke-test the live app

Test these URLs first:

- Frontend: `https://your-frontend-project.vercel.app`
- Backend health: `https://your-backend.onrender.com/api/health`
- Swagger: `https://your-backend.onrender.com/swagger-ui.html`

Then test the app flow:

1. Log in with seeded demo accounts.
2. Create a mentoring session as the mentor.
3. Copy and open the join link as the student.
4. Verify:
   - chat
   - code editor sync
   - join session flow
   - video call prompt

## Demo-day notes

- Render Free spins down after 15 minutes of inactivity, so open the backend health URL 1 to 2 minutes before the demo.
- Camera and microphone work only on `localhost` or secure origins. Your Vercel URL is secure, so use that during the demo.
- This project is STUN-ready by default, not TURN-backed by default. That means WebRTC usually works for demos, but some strict school, corporate, or carrier networks can still block media.
- If the video call matters a lot, test it on the exact network you will use in class before the presentation.

## Alternative options

### Render Postgres

Render officially offers a free Postgres plan, but it expires 30 days after creation. That makes it a poor fit if you want to keep the demo online for longer.

### Railway

Railway is still convenient technically, but its official pricing is now a one-time free trial with limited credits, so it is not the best no-cost showcase option anymore.

If you deploy the backend on Railway anyway:

1. Set the service Root Directory to `backend`.
2. Confirm Railway detects [railway.json](../backend/railway.json) and [Dockerfile](../backend/Dockerfile).
3. Add these variables in the Railway service `Variables` tab:

```text
JWT_SECRET=<generate-a-long-random-secret>
JWT_EXPIRATION_MINUTES=180
APP_CORS_ALLOWED_ORIGINS=https://your-frontend-project.vercel.app
APP_FRONTEND_URL=https://your-frontend-project.vercel.app
APP_SEED_DEMO_DATA=true
SPRING_DATASOURCE_URL=<jdbc-url-from-neon-or-railway-postgres>
SPRING_DATASOURCE_USERNAME=<database-username>
SPRING_DATASOURCE_PASSWORD=<database-password>
```

Railway does not deploy your local `backend/.env` file, and `railway.json` is for build and deploy settings, not secrets. If `JWT_SECRET` is missing or shorter than 32 bytes, Spring exits during startup and Railway reports the `/api/health` check as service unavailable.

For the frontend on Railway:

1. Create a second Railway service with Root Directory set to `frontend`.
2. Confirm Railway detects [railway.json](../frontend/railway.json) and [Dockerfile](../frontend/Dockerfile).
3. Add these variables in the frontend service `Variables` tab:

```text
BACKEND_ORIGIN=https://your-backend-service.up.railway.app
NEXT_PUBLIC_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
NEXT_PUBLIC_TURN_URLS=
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_CREDENTIAL=
```

The frontend now reads `BACKEND_ORIGIN` at runtime and uses it for both REST API and realtime WebSocket URLs, so the browser no longer depends on baked `localhost` backend URLs in production.

## TURN for stronger WebRTC reliability

For stronger real-world video reliability, configure a TURN server and set:

- `NEXT_PUBLIC_TURN_URLS`
- `NEXT_PUBLIC_TURN_USERNAME`
- `NEXT_PUBLIC_TURN_CREDENTIAL`

Without TURN, some restrictive NAT networks will let signaling connect while video or audio never fully establishes.
