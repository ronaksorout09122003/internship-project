package com.mentora.platform.dto.session;

import com.mentora.platform.entity.SessionDifficulty;
import com.mentora.platform.entity.SessionLanguage;
import com.mentora.platform.entity.SessionStatus;
import java.time.Instant;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        String sessionCode,
        String topic,
        String agenda,
        Instant scheduledAt,
        Integer durationMinutes,
        SessionDifficulty difficulty,
        SessionLanguage language,
        String templateKey,
        String studentGoal,
        String mentorNotes,
        String homework,
        String resourceLinks,
        String nextSteps,
        Integer studentRating,
        String studentFeedback,
        Instant feedbackSubmittedAt,
        SessionStatus status,
        Instant createdAt,
        Instant updatedAt,
        SessionParticipantResponse mentor,
        SessionParticipantResponse student,
        String latestCode
) {
}
