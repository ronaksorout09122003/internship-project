package com.mentora.platform.service;

import com.mentora.platform.dto.user.UpdateUserRequest;
import com.mentora.platform.dto.user.UserResponse;
import com.mentora.platform.entity.User;
import com.mentora.platform.exception.NotFoundException;
import com.mentora.platform.mapper.UserMapper;
import com.mentora.platform.repository.UserRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UUID userId) {
        return userMapper.toResponse(getEntityById(userId));
    }

    @Transactional(readOnly = true)
    public User getEntityById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User was not found"));
    }

    @Transactional
    public UserResponse updateCurrentUser(UUID userId, UpdateUserRequest request) {
        User user = getEntityById(userId);
        user.setDisplayName(request.displayName().trim());
        user.setHeadline(trimToNull(request.headline()));
        user.setBio(trimToNull(request.bio()));
        user.setTimezone(request.timezone().trim());
        user.setSkills(trimToNull(request.skills()));
        return userMapper.toResponse(user);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
