package com.mentora.platform.dto.user;

import com.mentora.platform.entity.Role;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        Role role,
        String displayName,
        String headline,
        String bio,
        String timezone,
        String skills,
        Instant createdAt
) {
}
