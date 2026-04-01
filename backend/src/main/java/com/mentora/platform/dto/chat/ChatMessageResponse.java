package com.mentora.platform.dto.chat;

import com.mentora.platform.entity.Role;
import java.time.Instant;
import java.util.UUID;

public record ChatMessageResponse(
        String type,
        UUID id,
        UUID sessionId,
        UUID senderId,
        String senderEmail,
        Role senderRole,
        String content,
        Instant createdAt
) {
}
