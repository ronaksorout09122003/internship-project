package com.mentora.platform.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mentora.platform.dto.auth.LoginRequest;
import com.mentora.platform.dto.auth.RegisterRequest;
import com.mentora.platform.entity.Role;
import com.mentora.platform.entity.User;
import com.mentora.platform.exception.ConflictException;
import com.mentora.platform.exception.UnauthorizedException;
import com.mentora.platform.mapper.UserMapper;
import com.mentora.platform.repository.UserRepository;
import com.mentora.platform.security.JwtService;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private UserMapper userMapper;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        userMapper = new UserMapper();
        authService = new AuthService(userRepository, passwordEncoder, jwtService, userMapper);
    }

    @Test
    void registerShouldRejectDuplicateEmail() {
        RegisterRequest request = new RegisterRequest(
                "mentor@example.com",
                "Mentor One",
                "Password123!",
                "Full-stack mentor",
                "Asia/Kolkata",
                "Java, React",
                Role.MENTOR
        );
        when(userRepository.existsByEmailIgnoreCase("mentor@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("An account with this email already exists");
    }

    @Test
    void registerShouldPersistUserAndReturnToken() {
        RegisterRequest request = new RegisterRequest(
                "mentor@example.com",
                "Mentor One",
                "Password123!",
                "Full-stack mentor",
                "Asia/Kolkata",
                "Java, React",
                Role.MENTOR
        );
        User savedUser = buildUser(UUID.randomUUID(), "mentor@example.com", Role.MENTOR, "encoded-password");

        when(userRepository.existsByEmailIgnoreCase("mentor@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(any())).thenReturn("jwt-token");

        var response = authService.register(request);

        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo("mentor@example.com");
        assertThat(response.user().displayName()).isEqualTo("Mentor One");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void loginShouldRejectInvalidPassword() {
        User user = buildUser(UUID.randomUUID(), "student@example.com", Role.STUDENT, "hash");
        when(userRepository.findByEmailIgnoreCase("student@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-pass", "hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("student@example.com", "wrong-pass")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid email or password");
    }

    private User buildUser(UUID id, String email, Role role, String passwordHash) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setRole(role);
        user.setPasswordHash(passwordHash);
        user.setDisplayName(role == Role.MENTOR ? "Mentor One" : "Student One");
        user.setTimezone("Asia/Kolkata");
        user.setHeadline(role == Role.MENTOR ? "Mentor" : "Student");
        user.setSkills(role == Role.MENTOR ? "Java, React" : "DSA");
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        return user;
    }
}
