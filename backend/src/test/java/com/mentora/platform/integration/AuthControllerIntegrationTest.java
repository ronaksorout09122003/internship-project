package com.mentora.platform.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentora.platform.dto.auth.LoginRequest;
import com.mentora.platform.dto.auth.RegisterRequest;
import com.mentora.platform.entity.Role;
import com.mentora.platform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void registerShouldReturnJwtAndUser() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "mentor@example.com",
                "Mentor One",
                "Password123!",
                "Full-stack mentor",
                "Asia/Kolkata",
                "Java, React",
                Role.MENTOR
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("mentor@example.com"))
                .andExpect(jsonPath("$.user.displayName").value("Mentor One"))
                .andExpect(jsonPath("$.user.role").value("MENTOR"));
    }

    @Test
    void registerShouldRejectDuplicateEmail() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "mentor@example.com",
                "Mentor One",
                "Password123!",
                "Full-stack mentor",
                "Asia/Kolkata",
                "Java, React",
                Role.MENTOR
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account with this email already exists"));
    }

    @Test
    void loginShouldRejectInvalidCredentials() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "student@example.com",
                "Student One",
                "Password123!",
                "Learner",
                "Asia/Kolkata",
                "DSA",
                Role.STUDENT
        );
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        LoginRequest loginRequest = new LoginRequest("student@example.com", "wrong-password");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void registerShouldRejectWeakPasswords() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "mentor@example.com",
                "Mentor One",
                "Password123",
                "Full-stack mentor",
                "Asia/Kolkata",
                "Java, React",
                Role.MENTOR
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.validationErrors.password").value(
                        "Password must include uppercase, lowercase, a number, and a special character"
                ));
    }
}
