package com.mentora.platform.dto.session;

import com.mentora.platform.entity.SessionDifficulty;
import com.mentora.platform.entity.SessionLanguage;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record CreateSessionRequest(
        @NotBlank(message = "Topic is required")
        @Size(max = 140, message = "Topic must be under 140 characters")
        String topic,
        @Size(max = 1600, message = "Agenda must be under 1600 characters")
        String agenda,
        Instant scheduledAt,
        @Max(value = 480, message = "Duration must be under 480 minutes")
        Integer durationMinutes,
        SessionDifficulty difficulty,
        SessionLanguage language,
        @Size(max = 60, message = "Template key is too long")
        String templateKey,
        @Size(max = 1600, message = "Student goal must be under 1600 characters")
        String studentGoal,
        @Size(max = 50000, message = "Initial code payload is too large")
        String initialCode
) {
}
