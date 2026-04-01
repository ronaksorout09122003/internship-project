package com.mentora.platform.dto.auth;

import com.mentora.platform.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email,
        @NotBlank(message = "Display name is required")
        @Size(max = 120, message = "Display name must be under 120 characters")
        String displayName,
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                message = "Password must include uppercase, lowercase, a number, and a special character"
        )
        String password,
        @Size(max = 160, message = "Headline must be under 160 characters")
        String headline,
        @Size(max = 80, message = "Timezone must be under 80 characters")
        String timezone,
        @Size(max = 500, message = "Skills must be under 500 characters")
        String skills,
        @NotNull(message = "Role is required")
        Role role
) {
}
