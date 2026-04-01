package com.mentora.platform.dto.session;

import com.mentora.platform.entity.SessionDifficulty;
import com.mentora.platform.entity.SessionLanguage;
import com.mentora.platform.entity.SessionStatus;
import java.time.Instant;
import java.util.UUID;

public record SessionSummaryResponse(
        UUID id,
        String sessionCode,
        String topic,
        Instant scheduledAt,
        Integer durationMinutes,
        SessionDifficulty difficulty,
        SessionLanguage language,
        Integer studentRating,
        SessionStatus status,
        Instant createdAt,
        SessionParticipantResponse mentor,
        SessionParticipantResponse student
) {
}
