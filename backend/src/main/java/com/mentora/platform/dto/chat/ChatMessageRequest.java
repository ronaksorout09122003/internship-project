package com.mentora.platform.dto.chat;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record ChatMessageRequest(
        @NotNull(message = "Session ID is required")
        UUID sessionId,
        @Size(max = 2000, message = "Message cannot exceed 2000 characters")
        String content,
        @Size(max = 160, message = "Snippet title must be under 160 characters")
        String snippetTitle,
        @Size(max = 30, message = "Snippet language must be under 30 characters")
        String snippetLanguage,
        @Size(max = 12000, message = "Snippet code must be under 12000 characters")
        String snippetCode
) {
    public boolean hasSnippet() {
        return snippetCode != null && !snippetCode.isBlank();
    }
}
