# Mentora

Mentora is a production-style 1-on-1 mentor-student platform built with Spring Boot, PostgreSQL, STOMP/WebSocket, WebRTC, and Next.js App Router. It supports secure JWT auth, private mentoring rooms, realtime chat, Monaco-based collaborative coding, and refresh-safe room recovery.

## Highlights

- Secure mentor/student registration and login with JWT + bcrypt
- Private session lifecycle with one mentor and one student per room
- Realtime chat persisted to PostgreSQL
- Realtime shared code editor with Monaco and last-write-wins sync
- WebRTC video calling with signaling over Spring WebSocket/STOMP
- TURN-ready ICE configuration for production WebRTC environments
- Reconnect-safe room UX with session recovery after refresh
- Dockerized local startup for frontend, backend, and PostgreSQL
- Backend unit + integration tests and frontend utility tests
- Swagger/OpenAPI at `http://localhost:8080/swagger-ui.html`

## Tech Stack

- Frontend: Next.js 16 App Router, TypeScript, Tailwind CSS v4, Axios, STOMP, SockJS, Monaco Editor, WebRTC, Sonner
- Backend: Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA, Spring Validation, Spring WebSocket, Flyway, PostgreSQL
- Runtime: Docker, Docker Compose

## Folder Tree

```text
.
├── .env.example
├── .gitignore
├── README.md
├── docker-compose.yml
├── docs
│   ├── architecture.md
│   ├── deployment.md
│   └── er-diagram.md
├── postman
│   └── mentor-platform.postman_collection.json
├── render.yaml
├── backend
│   ├── .env.example
│   ├── Dockerfile
│   ├── railway.json
│   ├── pom.xml
│   └── src
│       ├── main
│       │   ├── java
│       │   │   └── com
│       │   │       └── mentora
│       │   │           └── platform
│       │   │               ├── MentorPlatformApplication.java
│       │   │               ├── config
│       │   │               │   └── OpenApiConfig.java
│       │   │               ├── controller
│       │   │               │   ├── AuthController.java
│       │   │               │   ├── HealthController.java
│       │   │               │   ├── SessionController.java
│       │   │               │   └── UserController.java
│       │   │               ├── dto
│       │   │               │   ├── auth
│       │   │               │   ├── chat
│       │   │               │   ├── code
│       │   │               │   ├── common
│       │   │               │   ├── session
│       │   │               │   ├── signal
│       │   │               │   └── user
│       │   │               ├── entity
│       │   │               │   ├── BaseEntity.java
│       │   │               │   ├── ChatMessage.java
│       │   │               │   ├── CodeSnapshot.java
│       │   │               │   ├── MentoringSession.java
│       │   │               │   ├── Role.java
│       │   │               │   ├── SessionStatus.java
│       │   │               │   └── User.java
│       │   │               ├── exception
│       │   │               │   ├── BusinessException.java
│       │   │               │   ├── ConflictException.java
│       │   │               │   ├── ForbiddenException.java
│       │   │               │   ├── GlobalExceptionHandler.java
│       │   │               │   ├── NotFoundException.java
│       │   │               │   └── UnauthorizedException.java
│       │   │               ├── mapper
│       │   │               │   ├── MessageMapper.java
│       │   │               │   ├── SessionMapper.java
│       │   │               │   └── UserMapper.java
│       │   │               ├── repository
│       │   │               │   ├── ChatMessageRepository.java
│       │   │               │   ├── CodeSnapshotRepository.java
│       │   │               │   ├── MentoringSessionRepository.java
│       │   │               │   └── UserRepository.java
│       │   │               ├── security
│       │   │               │   ├── AuthenticatedUserPrincipal.java
│       │   │               │   ├── JwtAuthenticationFilter.java
│       │   │               │   ├── JwtService.java
│       │   │               │   ├── RestAccessDeniedHandler.java
│       │   │               │   ├── RestAuthenticationEntryPoint.java
│       │   │               │   ├── SecurityConfig.java
│       │   │               │   └── UserDetailsServiceImpl.java
│       │   │               ├── service
│       │   │               │   ├── AuthService.java
│       │   │               │   ├── CodeSnapshotService.java
│       │   │               │   ├── DemoDataService.java
│       │   │               │   ├── MessageService.java
│       │   │               │   ├── SessionService.java
│       │   │               │   └── UserService.java
│       │   │               └── websocket
│       │   │                   ├── CollaborationMessageController.java
│       │   │                   ├── JwtChannelInterceptor.java
│       │   │                   ├── WebSocketConfig.java
│       │   │                   └── WebSocketEventLogger.java
│       │   └── resources
│       │       ├── application-test.yml
│       │       ├── application.yml
│       │       └── db
│       │           └── migration
│       │               └── V1__init_schema.sql
│       └── test
│           └── java
│               └── com
│                   └── mentora
│                       └── platform
│                           ├── integration
│                           │   ├── AuthControllerIntegrationTest.java
│                           │   └── SessionControllerIntegrationTest.java
│                           └── service
│                               ├── AuthServiceTest.java
│                               └── SessionServiceTest.java
└── frontend
    ├── .env.example
    ├── Dockerfile
    ├── next-env.d.ts
    ├── next.config.ts
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs
    ├── tsconfig.json
    ├── vercel.json
    ├── vitest.config.ts
    ├── app
    │   ├── access-denied
    │   │   └── page.tsx
    │   ├── dashboard
    │   │   └── page.tsx
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── loading.tsx
    │   ├── login
    │   │   └── page.tsx
    │   ├── not-found.tsx
    │   ├── page.tsx
    │   ├── register
    │   │   └── page.tsx
    │   └── sessions
    │       └── [sessionId]
    │           └── page.tsx
    ├── components
    │   ├── auth
    │   │   └── auth-guard.tsx
    │   ├── providers
    │   │   ├── app-providers.tsx
    │   │   └── auth-provider.tsx
    │   ├── room
    │   │   ├── chat-panel.tsx
    │   │   ├── code-editor-panel.tsx
    │   │   ├── reconnect-banner.tsx
    │   │   ├── session-sidebar.tsx
    │   │   └── video-panel.tsx
    │   └── ui
    │       ├── brand-mark.tsx
    │       ├── button.tsx
    │       ├── input-field.tsx
    │       └── status-pill.tsx
    ├── hooks
    │   ├── use-auth.ts
    │   ├── use-debounced-callback.ts
    │   ├── use-session-realtime.ts
    │   └── use-webrtc.ts
    ├── lib
    │   └── constants.ts
    ├── public
    │   └── .gitkeep
    ├── services
    │   ├── api-client.ts
    │   ├── auth-service.ts
    │   └── session-service.ts
    ├── types
    │   ├── auth.ts
    │   ├── realtime.ts
    │   └── session.ts
    └── utils
        ├── __tests__
        │   ├── ice-servers.test.ts
        │   └── session-link.test.ts
        ├── api-error.ts
        ├── cn.ts
        ├── format.ts
        ├── session-link.ts
        └── storage.ts
```

## Prerequisites

- Java 21
- Maven 3.9+
- Node.js 22+
- Docker Desktop
- PostgreSQL 15+ if you do not use Docker for the database

## Environment Files

### Backend local env

Copy `backend/.env.example` to `backend/.env` and update at least `JWT_SECRET`.

```properties
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/mentor_platform
SPRING_DATASOURCE_USERNAME=mentor_user
SPRING_DATASOURCE_PASSWORD=mentor_password
JWT_SECRET=replace-with-a-32-character-minimum-secret
JWT_EXPIRATION_MINUTES=180
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000
APP_FRONTEND_URL=http://localhost:3000
APP_SEED_DEMO_DATA=true
```

### Frontend local env

Copy `frontend/.env.example` to `frontend/.env.local`.

```properties
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
NEXT_PUBLIC_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
NEXT_PUBLIC_TURN_URLS=
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_CREDENTIAL=
```

### Docker compose env

Copy the root `.env.example` to `.env`.

## Exact Run Commands

### Local development

1. Start PostgreSQL quickly with Docker:

```powershell
docker compose up -d db
```

2. Prepare env files:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

3. Start the backend:

```powershell
Set-Location backend
mvn spring-boot:run
```

4. In a new terminal, start the frontend:

```powershell
Set-Location frontend
npm install
npm run dev
```

5. Open:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## Architecture Artifacts

- Architecture diagram: [docs/architecture.md](docs/architecture.md)
- ER diagram: [docs/er-diagram.md](docs/er-diagram.md)
- Deployment guide: [docs/deployment.md](docs/deployment.md)

### Full Docker startup

```powershell
Copy-Item .env.example .env
docker compose up --build
```

This starts:

- PostgreSQL on `5432`
- Spring Boot backend on `8080`
- Next.js frontend on `3000`

## Database Migrations

- Flyway runs automatically on backend startup.
- Initial schema is defined in `backend/src/main/resources/db/migration/V1__init_schema.sql`.
- No manual migration step is required for normal local development.

## Demo Credentials

When `APP_SEED_DEMO_DATA=true`, the backend seeds:

- Mentor: `mentor@mentora.dev` / `DemoPass123!`
- Student: `student@mentora.dev` / `DemoPass123!`

## API Summary

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`

### Sessions

- `POST /api/sessions`
- `POST /api/sessions/create`
- `GET /api/sessions`
- `GET /api/sessions/{sessionId}`
- `POST /api/sessions/{sessionId}/join`
- `POST /api/sessions/join`
- `POST /api/sessions/{sessionId}/end`
- `POST /api/sessions/end`

### Chat

- `GET /api/sessions/{sessionId}/messages`

### Health

- `GET /api/health`

## WebSocket Contract

- Endpoint: `/ws`
- App destinations:
  - `/app/chat.send`
  - `/app/code.sync`
  - `/app/signal.send`
- Topics:
  - `/topic/sessions/{sessionId}/chat`
  - `/topic/sessions/{sessionId}/code`
  - `/topic/sessions/{sessionId}/signal`

JWT is sent in the STOMP `Authorization` header as `Bearer <token>`.

## Sample Postman Requests

- Import `postman/mentor-platform.postman_collection.json`
- Set:
  - `baseUrl=http://localhost:8080`
  - `mentorToken` after mentor login
  - `studentToken` after student login
  - `sessionId` after session creation

Quick examples:

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "mentor@example.com",
  "password": "Password123",
  "role": "MENTOR"
}
```

```http
POST /api/sessions
Authorization: Bearer <mentor-jwt>
Content-Type: application/json

{
  "topic": "Dynamic Programming Deep Dive",
  "initialCode": "function solve(input) {\n  return input;\n}"
}
```

```http
POST /api/sessions/{sessionId}/join
Authorization: Bearer <student-jwt>
```

## Tests and Verification

Verified in this workspace:

- `backend`: `mvn -q test`
- `frontend`: `npm run build`
- `frontend`: `npm run test`

## Free Demo Deployment

For the simplest no-cost teacher demo, use:

- Vercel Hobby for the frontend
- Render Free web service for the backend
- Neon Free Postgres for the database

The detailed walkthrough is in `docs/deployment.md`.

## Deployment Files

- Render backend blueprint: [render.yaml](render.yaml)
- Railway backend config: [backend/railway.json](backend/railway.json)
- Vercel frontend config: [frontend/vercel.json](frontend/vercel.json)

## Known Assumptions

- Each user has a single role: `MENTOR` or `STUDENT`
- A room supports exactly one mentor and one student
- Code sync uses a last-write-wins strategy
- WebRTC defaults to public STUN servers locally, but TURN env vars are available for production
- Mentor room metadata refreshes every 8 seconds to reflect joins and ended state

## Troubleshooting

- If the backend fails immediately, check that `JWT_SECRET` is set in the hosting provider variables and is at least 32 characters long.
- If Railway reports `/api/health` as service unavailable after a successful Docker build, open the deploy logs and verify `JWT_SECRET` plus database variables are present in the Railway service `Variables` tab. Railway does not deploy local `.env` files.
- If the frontend points to the wrong backend, verify `frontend/.env.local` and restart `npm run dev`.
- If video does not connect, allow camera/microphone access, use `localhost` or HTTPS, and configure TURN credentials for stricter NAT networks.
- If Docker frontend env values change, rebuild with `docker compose up --build`.
- If PostgreSQL port `5432` is busy, update the published port in `docker-compose.yml`.
