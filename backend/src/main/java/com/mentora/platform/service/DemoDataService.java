package com.mentora.platform.service;

import com.mentora.platform.entity.Role;
import com.mentora.platform.entity.User;
import com.mentora.platform.repository.UserRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DemoDataService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DemoDataService.class);

    @Bean
    ApplicationRunner seedUsers(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed-demo-data:false}") boolean seedDemoData
    ) {
        return args -> {
            if (!seedDemoData) {
                return;
            }

            createUserIfMissing(userRepository, passwordEncoder, "mentor@mentora.dev", Role.MENTOR);
            createUserIfMissing(userRepository, passwordEncoder, "student@mentora.dev", Role.STUDENT);
            LOGGER.info("Demo accounts are available for local review");
        };
    }

    private void createUserIfMissing(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String email,
            Role role
    ) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return;
        }

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("DemoPass123!"));
        user.setDisplayName(role == Role.MENTOR ? "Aarav Mentor" : "Siya Student");
        user.setHeadline(role == Role.MENTOR ? "Senior full-stack mentor" : "Interview prep learner");
        user.setBio(role == Role.MENTOR
                ? "Guides students through interviews, architecture, and practical debugging sessions."
                : "Working through DSA, frontend fundamentals, and live coding confidence.");
        user.setTimezone("Asia/Kolkata");
        user.setSkills(role == Role.MENTOR ? "Java, Spring Boot, Next.js, System Design" : "DSA, React, Problem Solving");
        user.setRole(role);
        userRepository.save(user);
    }
}
