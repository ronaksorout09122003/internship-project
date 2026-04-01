package com.mentora.platform.dto.session;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record JoinSessionRequest(
        UUID sessionId,
        @Size(max = 32, message = "Session code cannot exceed 32 characters")
        String sessionCode
) {

    public JoinSessionRequest(UUID sessionId) {
        this(sessionId, null);
    }

    @AssertTrue(message = "Provide either a session ID or a session code")
    public boolean hasReference() {
        return sessionId != null || (sessionCode != null && !sessionCode.isBlank());
    }

    @AssertTrue(message = "Use either a session ID or a session code, not both")
    public boolean hasSingleReference() {
        return sessionId == null || sessionCode == null || sessionCode.isBlank();
    }
}
