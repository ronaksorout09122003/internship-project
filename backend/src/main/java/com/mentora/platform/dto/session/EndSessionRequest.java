package com.mentora.platform.dto.session;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record EndSessionRequest(
        @NotNull(message = "Session ID is required")
        UUID sessionId
) {
}
