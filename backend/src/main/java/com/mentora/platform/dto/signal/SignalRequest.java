package com.mentora.platform.dto.signal;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record SignalRequest(
        @NotNull(message = "Session ID is required")
        UUID sessionId,
        @NotNull(message = "Signal type is required")
        SignalType signalType,
        Map<String, Object> payload,
        Instant clientTimestamp
) {
}
