package com.mentora.platform.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @NotBlank(message = "Display name is required")
        @Size(max = 120, message = "Display name must be under 120 characters")
        String displayName,
        @Size(max = 160, message = "Headline must be under 160 characters")
        String headline,
        @Size(max = 2000, message = "Bio must be under 2000 characters")
        String bio,
        @NotBlank(message = "Timezone is required")
        @Size(max = 80, message = "Timezone must be under 80 characters")
        String timezone,
        @Size(max = 500, message = "Skills must be under 500 characters")
        String skills
) {
}
