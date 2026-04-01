package com.mentora.platform.dto.code;

import java.time.Instant;
import java.util.UUID;

public record CodeSyncResponse(
        String type,
        UUID sessionId,
        UUID senderId,
        String code,
        Instant updatedAt
) {
}
