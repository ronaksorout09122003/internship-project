package com.mentora.platform.service;

import com.mentora.platform.dto.auth.AuthResponse;
import com.mentora.platform.dto.auth.LoginRequest;
import com.mentora.platform.dto.auth.RegisterRequest;
import com.mentora.platform.entity.User;
import com.mentora.platform.exception.ConflictException;
import com.mentora.platform.exception.UnauthorizedException;
import com.mentora.platform.mapper.UserMapper;
import com.mentora.platform.repository.UserRepository;
import com.mentora.platform.security.AuthenticatedUserPrincipal;
import com.mentora.platform.security.JwtService;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UserMapper userMapper
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userMapper = userMapper;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("An account with this email already exists");
        }

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName().trim());
        user.setHeadline(trimToNull(request.headline()));
        user.setTimezone(normalizeTimezone(request.timezone()));
        user.setSkills(trimToNull(request.skills()));
        user.setRole(request.role());

        User savedUser = userRepository.save(user);
        LOGGER.info("Registered new {} account for {}", savedUser.getRole(), savedUser.getEmail());

        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getPasswordHash(),
                savedUser.getRole()
        );

        return new AuthResponse(jwtService.generateToken(principal), "Bearer", userMapper.toResponse(savedUser));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getRole()
        );
        LOGGER.info("Successful login for {}", user.getEmail());
        return new AuthResponse(jwtService.generateToken(principal), "Bearer", userMapper.toResponse(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeTimezone(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            return "UTC";
        }

        return timezone.trim();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
