package com.mentora.platform.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mentora.platform.dto.session.CreateSessionRequest;
import com.mentora.platform.entity.ChatMessage;
import com.mentora.platform.entity.ChatMessageKind;
import com.mentora.platform.entity.CodeSnapshot;
import com.mentora.platform.entity.MentoringSession;
import com.mentora.platform.entity.Role;
import com.mentora.platform.entity.SessionDifficulty;
import com.mentora.platform.entity.SessionLanguage;
import com.mentora.platform.entity.SessionStatus;
import com.mentora.platform.entity.User;
import com.mentora.platform.exception.ConflictException;
import com.mentora.platform.exception.ForbiddenException;
import com.mentora.platform.mapper.MessageMapper;
import com.mentora.platform.mapper.SessionMapper;
import com.mentora.platform.mapper.UserMapper;
import com.mentora.platform.repository.ChatMessageRepository;
import com.mentora.platform.repository.MentoringSessionRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private MentoringSessionRepository sessionRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private CodeSnapshotService codeSnapshotService;

    @Mock
    private UserService userService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private SessionService sessionService;

    @BeforeEach
    void setUp() {
        sessionService = new SessionService(
                sessionRepository,
                chatMessageRepository,
                codeSnapshotService,
                new MessageMapper(),
                new SessionMapper(new UserMapper()),
                userService,
                messagingTemplate
        );
    }

    @Test
    void createSessionShouldRejectStudentCaller() {
        User student = buildUser(UUID.randomUUID(), "student@example.com", Role.STUDENT);
        when(userService.getEntityById(student.getId())).thenReturn(student);

        assertThatThrownBy(() -> sessionService.createSession(
                student.getId(),
                new CreateSessionRequest("Graphs", null, null, null, null, null, null, null, null)
        )).isInstanceOf(ForbiddenException.class)
                .hasMessage("Only mentors can create sessions");
    }

    @Test
    void joinSessionShouldActivateCreatedSession() {
        User mentor = buildUser(UUID.randomUUID(), "mentor@example.com", Role.MENTOR);
        User student = buildUser(UUID.randomUUID(), "student@example.com", Role.STUDENT);
        MentoringSession session = buildSession(UUID.randomUUID(), "PAIR1234", mentor);
        CodeSnapshot snapshot = new CodeSnapshot();
        snapshot.setId(UUID.randomUUID());
        snapshot.setSession(session);
        snapshot.setCode("console.log('hi');");

        when(userService.getEntityById(student.getId())).thenReturn(student);
        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(codeSnapshotService.findBySessionId(session.getId())).thenReturn(Optional.of(snapshot));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = sessionService.joinSession(session.getId(), student.getId());

        assertThat(response.status()).isEqualTo(SessionStatus.ACTIVE);
        assertThat(response.student()).isNotNull();
        assertThat(session.getStudent()).isEqualTo(student);

        ArgumentCaptor<ChatMessage> timelineMessageCaptor = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatMessageRepository).save(timelineMessageCaptor.capture());
        assertThat(timelineMessageCaptor.getValue().getMessageKind()).isEqualTo(ChatMessageKind.SYSTEM);
        assertThat(timelineMessageCaptor.getValue().getContent()).contains("joined the room");
    }

    @Test
    void joinSessionShouldRejectEndedSession() {
        User mentor = buildUser(UUID.randomUUID(), "mentor@example.com", Role.MENTOR);
        User student = buildUser(UUID.randomUUID(), "student@example.com", Role.STUDENT);
        MentoringSession session = buildSession(UUID.randomUUID(), "PAIR1234", mentor);
        session.setStatus(SessionStatus.ENDED);

        when(userService.getEntityById(student.getId())).thenReturn(student);
        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.joinSession(session.getId(), student.getId()))
                .isInstanceOf(ConflictException.class)
                .hasMessage("This session has already ended");
    }

    private User buildUser(UUID id, String email, Role role) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setRole(role);
        user.setPasswordHash("hash");
        user.setDisplayName(role == Role.MENTOR ? "Mentor One" : "Student One");
        user.setTimezone("Asia/Kolkata");
        user.setHeadline(role == Role.MENTOR ? "Mentor" : "Student");
        user.setSkills(role == Role.MENTOR ? "Java, Spring" : "React, DSA");
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        return user;
    }

    private MentoringSession buildSession(UUID id, String code, User mentor) {
        MentoringSession session = new MentoringSession();
        session.setId(id);
        session.setSessionCode(code);
        session.setTopic("Topic");
        session.setDurationMinutes(60);
        session.setDifficulty(SessionDifficulty.INTERMEDIATE);
        session.setLanguage(SessionLanguage.TYPESCRIPT);
        session.setTemplateKey("PAIR_PROGRAMMING");
        session.setMentor(mentor);
        session.setStatus(SessionStatus.CREATED);
        session.setCreatedAt(Instant.now());
        session.setUpdatedAt(Instant.now());
        return session;
    }
}
