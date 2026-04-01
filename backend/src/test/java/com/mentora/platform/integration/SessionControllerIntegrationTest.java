package com.mentora.platform.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentora.platform.dto.session.CreateSessionRequest;
import com.mentora.platform.entity.Role;
import com.mentora.platform.entity.User;
import com.mentora.platform.repository.ChatMessageRepository;
import com.mentora.platform.repository.CodeSnapshotRepository;
import com.mentora.platform.repository.MentoringSessionRepository;
import com.mentora.platform.repository.UserRepository;
import com.mentora.platform.security.AuthenticatedUserPrincipal;
import com.mentora.platform.security.JwtService;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SessionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MentoringSessionRepository sessionRepository;

    @Autowired
    private CodeSnapshotRepository codeSnapshotRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        chatMessageRepository.deleteAll();
        codeSnapshotRepository.deleteAll();
        sessionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void mentorShouldCreateAndStudentShouldJoinSession() throws Exception {
        User mentor = createUser("mentor@example.com", Role.MENTOR);
        User student = createUser("student@example.com", Role.STUDENT);
        String mentorToken = bearerTokenFor(mentor);
        String studentToken = bearerTokenFor(student);

        String createResponse = mockMvc.perform(post("/api/sessions")
                        .header(HttpHeaders.AUTHORIZATION, mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateSessionRequest(
                                "Dynamic Programming",
                                "Practice recursion and memoization patterns.",
                                null,
                                75,
                                null,
                                null,
                                "ALGORITHM_DRILL",
                                "Finish two medium DP problems with guidance.",
                                null
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.topic").value("Dynamic Programming"))
                .andExpect(jsonPath("$.templateKey").value("ALGORITHM_DRILL"))
                .andExpect(jsonPath("$.status").value("CREATED"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String sessionId = objectMapper.readTree(createResponse).get("id").asText();

        mockMvc.perform(post("/api/sessions/{sessionId}/join", sessionId)
                        .header(HttpHeaders.AUTHORIZATION, studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.student.email").value("student@example.com"));
    }

    @Test
    void studentShouldNotCreateMentorOnlySession() throws Exception {
        User student = createUser("student@example.com", Role.STUDENT);

        mockMvc.perform(post("/api/sessions")
                        .header(HttpHeaders.AUTHORIZATION, bearerTokenFor(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateSessionRequest(
                                "Arrays",
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null
                        ))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Only mentors can create sessions"));
    }

    @Test
    void unauthorizedAccessShouldBeBlocked() throws Exception {
        mockMvc.perform(get("/api/sessions"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication is required to access this resource"));
    }

    private User createUser(String email, Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("Password123"));
        user.setDisplayName(role == Role.MENTOR ? "Mentor Account" : "Student Account");
        user.setTimezone("Asia/Kolkata");
        user.setHeadline(role == Role.MENTOR ? "Mentor" : "Student");
        user.setSkills(role == Role.MENTOR ? "Java, Spring" : "React, DSA");
        user.setRole(role);
        return userRepository.save(user);
    }

    private String bearerTokenFor(User user) {
        String token = jwtService.generateToken(new AuthenticatedUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getRole()
        ));
        return "Bearer " + token;
    }
}
