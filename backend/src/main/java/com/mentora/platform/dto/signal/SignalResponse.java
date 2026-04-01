package com.mentora.platform.dto.signal;

import com.mentora.platform.entity.Role;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record SignalResponse(
        String type,
        UUID sessionId,
        SignalType signalType,
        UUID senderId,
        String senderEmail,
        Role senderRole,
        Map<String, Object> payload,
        Instant sentAt
) {
}
