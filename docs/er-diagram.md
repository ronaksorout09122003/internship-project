# ER Diagram

```mermaid
erDiagram
    USERS {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR role
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    SESSIONS {
        UUID id PK
        VARCHAR session_code UK
        VARCHAR topic
        UUID mentor_id FK
        UUID student_id FK
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    MESSAGES {
        UUID id PK
        UUID session_id FK
        UUID sender_id FK
        TEXT content
        TIMESTAMP created_at
    }

    CODE_SNAPSHOTS {
        UUID id PK
        UUID session_id FK
        TEXT code
        TIMESTAMP updated_at
    }

    USERS ||--o{ SESSIONS : mentors
    USERS ||--o| SESSIONS : joins_as_student
    USERS ||--o{ MESSAGES : sends
    SESSIONS ||--o{ MESSAGES : contains
    SESSIONS ||--o| CODE_SNAPSHOTS : latest_snapshot
```

## Notes

- A session always has one mentor.
- A session may have zero or one student until joined.
- Chat messages are persisted in chronological order per session.
- Code snapshots are stored as the latest known editor state for recovery after refresh/reconnect.
