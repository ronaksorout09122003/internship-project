# Architecture Diagram

```mermaid
flowchart LR
    Student[Student Browser\nNext.js + Monaco + WebRTC]
    Mentor[Mentor Browser\nNext.js + Monaco + WebRTC]
    Frontend[Next.js Frontend\nApp Router + Axios + STOMP]
    Backend[Spring Boot Backend\nREST + Security + STOMP]
    DB[(PostgreSQL)]
    WS[WebSocket Broker\nSTOMP + SockJS]

    Student --> Frontend
    Mentor --> Frontend
    Frontend -->|REST auth/session APIs| Backend
    Frontend -->|STOMP /ws| WS
    WS --> Backend
    Backend --> DB
    Student -.->|WebRTC media| Mentor
    Mentor -.->|WebRTC media| Student
    Frontend -->|offer / answer / ICE via STOMP| Backend
```

## Layering

- Frontend: route-level pages, room components, auth provider, realtime hooks, WebRTC hook
- Backend: controller -> service -> repository -> entity
- Realtime: STOMP destinations for chat, code sync, and signaling
- Persistence: users, sessions, messages, code snapshots

## Runtime Boundaries

- REST is used for auth, session lifecycle, history fetch, and recovery after refresh
- WebSocket/STOMP is used for low-latency room collaboration
- WebRTC transports media peer-to-peer; Spring Boot acts only as the signaling layer
