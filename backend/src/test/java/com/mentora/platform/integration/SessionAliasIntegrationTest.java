package com.mentora.platform.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentora.platform.dto.session.CreateSessionRequest;
import com.mentora.platform.dto.session.EndSessionRequest;
import com.mentora.platform.dto.session.JoinSessionRequest;
import com.mentora.platform.entity.Role;
import com.mentora.platform.entity.User;
import com.mentora.platform.repository.ChatMessageRepository;
import com.mentora.platform.repository.CodeSnapshotRepository;
import com.mentora.platform.repository.MentoringSessionRepository;
import com.mentora.platform.repository.UserRepository;
import com.mentora.platform.security.AuthenticatedUserPrincipal;
import com.mentora.platform.security.JwtService;
import java.util.Map;
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
class SessionAliasIntegrationTest {

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
    void aliasEndpointsShouldCreateJoinAndEndSession() throws Exception {
        User mentor = createUser("mentor-alias@example.com", Role.MENTOR);
        User student = createUser("student-alias@example.com", Role.STUDENT);

        String createResponse = mockMvc.perform(post("/api/sessions/create")
                        .header(HttpHeaders.AUTHORIZATION, bearerTokenFor(mentor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateSessionRequest(
                                "System Design",
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CREATED"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String sessionId = objectMapper.readTree(createResponse).get("id").asText();

        mockMvc.perform(post("/api/sessions/join")
                        .header(HttpHeaders.AUTHORIZATION, bearerTokenFor(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new JoinSessionRequest(UUID.fromString(sessionId)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        mockMvc.perform(post("/api/sessions/end")
                        .header(HttpHeaders.AUTHORIZATION, bearerTokenFor(mentor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new EndSessionRequest(UUID.fromString(sessionId)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ENDED"));
    }

    @Test
    void joinAliasShouldAcceptSessionCode() throws Exception {
        User mentor = createUser("mentor-code@example.com", Role.MENTOR);
        User student = createUser("student-code@example.com", Role.STUDENT);

        String createResponse = mockMvc.perform(post("/api/sessions/create")
                        .header(HttpHeaders.AUTHORIZATION, bearerTokenFor(mentor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateSessionRequest(
                                "Live Coding",
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null
                        ))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String sessionCode = objectMapper.readTree(createResponse).get("sessionCode").asText();

        mockMvc.perform(post("/api/sessions/join")
                        .header(HttpHeaders.AUTHORIZATION, bearerTokenFor(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("sessionCode", sessionCode.toLowerCase()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.student.email").value("student-code@example.com"));
    }

    private User createUser(String email, Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("Password123"));
        user.setDisplayName(role == Role.MENTOR ? "Alias Mentor" : "Alias Student");
        user.setTimezone("Asia/Kolkata");
        user.setHeadline(role == Role.MENTOR ? "Mentor" : "Student");
        user.setSkills(role == Role.MENTOR ? "Java" : "DSA");
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
