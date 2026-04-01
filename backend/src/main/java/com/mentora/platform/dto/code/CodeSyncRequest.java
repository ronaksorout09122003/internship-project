package com.mentora.platform.dto.code;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CodeSyncRequest(
        @NotNull(message = "Session ID is required")
        UUID sessionId,
        @NotBlank(message = "Code content is required")
        @Size(max = 200000, message = "Code payload is too large")
        String code
) {
}
