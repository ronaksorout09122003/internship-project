package com.mentora.platform.dto.session;

import com.mentora.platform.entity.SessionDifficulty;
import com.mentora.platform.entity.SessionLanguage;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record UpdateSessionRequest(
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
        @Size(max = 4000, message = "Mentor notes must be under 4000 characters")
        String mentorNotes,
        @Size(max = 2400, message = "Homework must be under 2400 characters")
        String homework,
        @Size(max = 2400, message = "Resource links must be under 2400 characters")
        String resourceLinks,
        @Size(max = 2400, message = "Next steps must be under 2400 characters")
        String nextSteps,
        @Min(value = 1, message = "Rating must be between 1 and 5")
        @Max(value = 5, message = "Rating must be between 1 and 5")
        Integer studentRating,
        @Size(max = 2000, message = "Feedback must be under 2000 characters")
        String studentFeedback
) {
}
