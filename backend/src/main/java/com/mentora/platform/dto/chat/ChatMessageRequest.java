package com.mentora.platform.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record ChatMessageRequest(
        @NotNull(message = "Session ID is required")
        UUID sessionId,
        @NotBlank(message = "Message content is required")
        @Size(max = 2000, message = "Message cannot exceed 2000 characters")
        String content
) {
}
