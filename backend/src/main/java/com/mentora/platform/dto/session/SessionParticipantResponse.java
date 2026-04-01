package com.mentora.platform.dto.session;

import com.mentora.platform.entity.Role;
import java.util.UUID;

public record SessionParticipantResponse(
        UUID id,
        String email,
        Role role,
        String displayName,
        String headline,
        String timezone
) {
}
