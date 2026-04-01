package com.mentora.platform.mapper;

import com.mentora.platform.dto.session.SessionResponse;
import com.mentora.platform.dto.session.SessionSummaryResponse;
import com.mentora.platform.entity.CodeSnapshot;
import com.mentora.platform.entity.MentoringSession;
import org.springframework.stereotype.Component;

@Component
public class SessionMapper {

    private final UserMapper userMapper;

    public SessionMapper(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public SessionResponse toResponse(MentoringSession session, CodeSnapshot snapshot) {
        return new SessionResponse(
                session.getId(),
                session.getSessionCode(),
                session.getTopic(),
                session.getAgenda(),
                session.getScheduledAt(),
                session.getDurationMinutes(),
                session.getDifficulty(),
                session.getLanguage(),
                session.getTemplateKey(),
                session.getStudentGoal(),
                session.getMentorNotes(),
                session.getHomework(),
                session.getResourceLinks(),
                session.getNextSteps(),
                session.getStudentRating(),
                session.getStudentFeedback(),
                session.getFeedbackSubmittedAt(),
                session.getStatus(),
                session.getCreatedAt(),
                session.getUpdatedAt(),
                userMapper.toParticipant(session.getMentor()),
                userMapper.toParticipant(session.getStudent()),
                snapshot != null ? snapshot.getCode() : ""
        );
    }

    public SessionSummaryResponse toSummary(MentoringSession session) {
        return new SessionSummaryResponse(
                session.getId(),
                session.getSessionCode(),
                session.getTopic(),
                session.getScheduledAt(),
                session.getDurationMinutes(),
                session.getDifficulty(),
                session.getLanguage(),
                session.getStudentRating(),
                session.getStatus(),
                session.getCreatedAt(),
                userMapper.toParticipant(session.getMentor()),
                userMapper.toParticipant(session.getStudent())
        );
    }
}
