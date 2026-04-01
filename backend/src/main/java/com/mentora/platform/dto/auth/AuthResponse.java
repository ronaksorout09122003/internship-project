package com.mentora.platform.dto.auth;

import com.mentora.platform.dto.user.UserResponse;

public record AuthResponse(
        String accessToken,
        String tokenType,
        UserResponse user
) {
}
