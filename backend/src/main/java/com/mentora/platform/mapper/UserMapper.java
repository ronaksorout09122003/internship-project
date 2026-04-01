package com.mentora.platform.mapper;

import com.mentora.platform.dto.session.SessionParticipantResponse;
import com.mentora.platform.dto.user.UserResponse;
import com.mentora.platform.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getDisplayName(),
                user.getHeadline(),
                user.getBio(),
                user.getTimezone(),
                user.getSkills(),
                user.getCreatedAt()
        );
    }

    public SessionParticipantResponse toParticipant(User user) {
        if (user == null) {
            return null;
        }

        return new SessionParticipantResponse(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getDisplayName(),
                user.getHeadline(),
                user.getTimezone()
        );
    }
}
