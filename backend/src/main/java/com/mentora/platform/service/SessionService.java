package com.mentora.platform.service;

import com.mentora.platform.dto.session.CreateSessionRequest;
import com.mentora.platform.dto.session.SessionResponse;
import com.mentora.platform.dto.session.SessionSummaryResponse;
import com.mentora.platform.dto.session.UpdateSessionRequest;
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
import com.mentora.platform.exception.NotFoundException;
import com.mentora.platform.mapper.MessageMapper;
import com.mentora.platform.mapper.SessionMapper;
import com.mentora.platform.repository.ChatMessageRepository;
import com.mentora.platform.repository.MentoringSessionRepository;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(SessionService.class);
    private static final String SESSION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final MentoringSessionRepository sessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CodeSnapshotService codeSnapshotService;
    private final MessageMapper messageMapper;
    private final SessionMapper sessionMapper;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public SessionService(
            MentoringSessionRepository sessionRepository,
            ChatMessageRepository chatMessageRepository,
            CodeSnapshotService codeSnapshotService,
            MessageMapper messageMapper,
            SessionMapper sessionMapper,
            UserService userService,
            @Lazy
            SimpMessagingTemplate messagingTemplate
    ) {
        this.sessionRepository = sessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.codeSnapshotService = codeSnapshotService;
        this.messageMapper = messageMapper;
        this.sessionMapper = sessionMapper;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public SessionResponse createSession(UUID mentorId, CreateSessionRequest request) {
        User mentor = userService.getEntityById(mentorId);
        if (mentor.getRole() != Role.MENTOR) {
            throw new ForbiddenException("Only mentors can create sessions");
        }

        SessionLanguage language = request.language() != null ? request.language() : SessionLanguage.TYPESCRIPT;
        String templateKey = normalizeTemplateKey(request.templateKey());

        MentoringSession session = new MentoringSession();
        session.setId(UUID.randomUUID());
        session.setMentor(mentor);
        session.setTopic(request.topic().trim());
        session.setAgenda(trimToNull(request.agenda()));
        session.setScheduledAt(request.scheduledAt());
        session.setDurationMinutes(resolveDurationMinutes(request.durationMinutes()));
        session.setDifficulty(request.difficulty() != null ? request.difficulty() : SessionDifficulty.INTERMEDIATE);
        session.setLanguage(language);
        session.setTemplateKey(templateKey);
        session.setStudentGoal(trimToNull(request.studentGoal()));
        session.setSessionCode(generateSessionCode());
        session.setStatus(SessionStatus.CREATED);

        MentoringSession savedSession = sessionRepository.save(session);
        CodeSnapshot snapshot = codeSnapshotService.initializeSnapshot(
                savedSession,
                defaultCodeTemplate(
                        savedSession.getTopic(),
                        request.initialCode(),
                        savedSession.getLanguage(),
                        savedSession.getTemplateKey()
                )
        );

        LOGGER.info("Mentor {} created session {}", mentor.getEmail(), savedSession.getId());
        return sessionMapper.toResponse(savedSession, snapshot);
    }

    @Transactional
    public SessionResponse joinSession(UUID sessionId, UUID studentId) {
        User student = userService.getEntityById(studentId);
        MentoringSession session = getSessionEntity(sessionId);
        return joinSession(session, student);
    }

    @Transactional
    public SessionResponse joinSession(UUID sessionId, String sessionCode, UUID studentId) {
        User student = userService.getEntityById(studentId);
        MentoringSession session = resolveSessionForJoin(sessionId, sessionCode);
        return joinSession(session, student);
    }

    private SessionResponse joinSession(MentoringSession session, User student) {
        if (student.getRole() != Role.STUDENT) {
            throw new ForbiddenException("Only students can join sessions");
        }

        if (session.getStatus() == SessionStatus.ENDED) {
            throw new ConflictException("This session has already ended");
        }

        if (session.getMentor().getId().equals(student.getId())) {
            throw new ForbiddenException("A mentor cannot join their own session as a student");
        }

        if (session.getStudent() != null) {
            if (session.getStudent().getId().equals(student.getId())) {
                CodeSnapshot snapshot = codeSnapshotService.findBySessionId(session.getId()).orElse(null);
                return sessionMapper.toResponse(session, snapshot);
            }
            throw new ConflictException("This session already has a student");
        }

        session.setStudent(student);
        session.setStatus(SessionStatus.ACTIVE);
        CodeSnapshot snapshot = codeSnapshotService.findBySessionId(session.getId()).orElse(null);
        publishSystemMessage(
                session,
                student,
                "%s joined the room. The session is now live.".formatted(student.getDisplayName())
        );

        LOGGER.info("Student {} joined session {}", student.getEmail(), session.getId());
        return sessionMapper.toResponse(session, snapshot);
    }

    @Transactional
    public SessionResponse endSession(UUID sessionId, UUID requesterId) {
        MentoringSession session = getSessionEntity(sessionId);
        if (!session.getMentor().getId().equals(requesterId)) {
            throw new ForbiddenException("Only the session mentor can end this session");
        }

        session.setStatus(SessionStatus.ENDED);
        publishSystemMessage(
                session,
                session.getMentor(),
                "%s ended the session. Collaboration is now read-only.".formatted(session.getMentor().getDisplayName())
        );
        LOGGER.info("Session {} ended by mentor {}", sessionId, requesterId);
        CodeSnapshot snapshot = codeSnapshotService.findBySessionId(sessionId).orElse(null);
        return sessionMapper.toResponse(session, snapshot);
    }

    @Transactional(readOnly = true)
    public SessionResponse getSession(UUID sessionId, UUID requesterId) {
        MentoringSession session = getSessionEntity(sessionId);
        ensureParticipant(session, requesterId);
        CodeSnapshot snapshot = codeSnapshotService.findBySessionId(sessionId).orElse(null);
        return sessionMapper.toResponse(session, snapshot);
    }

    @Transactional(readOnly = true)
    public List<SessionSummaryResponse> listMySessions(UUID requesterId) {
        User currentUser = userService.getEntityById(requesterId);
        List<MentoringSession> sessions = currentUser.getRole() == Role.MENTOR
                ? sessionRepository.findByMentorIdOrderByCreatedAtDesc(requesterId)
                : sessionRepository.findByStudentIdOrderByCreatedAtDesc(requesterId);

        return sessions.stream().map(sessionMapper::toSummary).toList();
    }

    @Transactional
    public SessionResponse updateSession(UUID sessionId, UUID requesterId, UpdateSessionRequest request) {
        MentoringSession session = getSessionEntity(sessionId);
        ensureParticipant(session, requesterId);

        boolean isMentor = session.getMentor().getId().equals(requesterId);
        SessionLanguage previousLanguage = session.getLanguage();
        String previousTemplateKey = session.getTemplateKey();
        Instant previousFeedbackSubmittedAt = session.getFeedbackSubmittedAt();
        boolean touched = false;

        if (isMentor) {
            touched = applyMentorUpdates(session, request);
            if (request.studentRating() != null || request.studentFeedback() != null) {
                throw new ForbiddenException("Students are the only participants who can submit session feedback");
            }
        } else {
            if (hasMentorOnlyUpdates(request)) {
                throw new ForbiddenException("Only the session mentor can edit planning and notes");
            }
            touched = applyStudentFeedback(session, request);
        }

        if (!touched) {
            CodeSnapshot currentSnapshot = codeSnapshotService.findBySessionId(sessionId).orElse(null);
            return sessionMapper.toResponse(session, currentSnapshot);
        }

        if (isMentor) {
            publishMentorWorkspaceEvents(session, previousLanguage, previousTemplateKey, request);
        } else if (session.getStudent() != null) {
            publishStudentFeedbackEvent(session, previousFeedbackSubmittedAt);
        }

        LOGGER.info("Session {} updated by participant {}", sessionId, requesterId);
        CodeSnapshot snapshot = codeSnapshotService.findBySessionId(sessionId).orElse(null);
        return sessionMapper.toResponse(session, snapshot);
    }

    @Transactional(readOnly = true)
    public MentoringSession getSessionEntity(UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session was not found"));
    }

    @Transactional(readOnly = true)
    public void ensureParticipant(UUID sessionId, UUID userId) {
        ensureParticipant(getSessionEntity(sessionId), userId);
    }

    @Transactional(readOnly = true)
    public void ensureParticipant(MentoringSession session, UUID userId) {
        boolean isMentor = session.getMentor().getId().equals(userId);
        boolean isStudent = session.getStudent() != null && session.getStudent().getId().equals(userId);
        if (!isMentor && !isStudent) {
            throw new ForbiddenException("You are not a participant in this session");
        }
    }

    private MentoringSession resolveSessionForJoin(UUID sessionId, String sessionCode) {
        if (sessionId != null) {
            return getSessionEntity(sessionId);
        }

        if (sessionCode == null || sessionCode.isBlank()) {
            throw new IllegalArgumentException("Session ID or session code is required");
        }

        return sessionRepository.findBySessionCodeIgnoreCase(normalizeSessionCode(sessionCode))
                .orElseThrow(() -> new NotFoundException("Session was not found"));
    }

    private String normalizeSessionCode(String sessionCode) {
        return sessionCode.trim().toUpperCase(Locale.ROOT);
    }

    private String generateSessionCode() {
        for (int attempt = 0; attempt < 8; attempt++) {
            StringBuilder builder = new StringBuilder(8);
            for (int index = 0; index < 8; index++) {
                int randomIndex = ThreadLocalRandom.current().nextInt(SESSION_CODE_ALPHABET.length());
                builder.append(SESSION_CODE_ALPHABET.charAt(randomIndex));
            }
            String code = builder.toString();
            if (!sessionRepository.existsBySessionCode(code)) {
                return code;
            }
        }
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String defaultCodeTemplate(
            String topic,
            String requestedInitialCode,
            SessionLanguage language,
            String templateKey
    ) {
        if (requestedInitialCode != null && !requestedInitialCode.isBlank()) {
            return requestedInitialCode;
        }

        return switch (language) {
            case JAVASCRIPT -> """
                    /**
                     * Mentoring starter
                     * Topic: %s
                     * Track: %s
                     */
                    function runSession(input) {
                      return input;
                    }

                    console.log(runSession("ready"));
                    """.formatted(topic, humanizeTemplateKey(templateKey));
            case PYTHON -> """
                    \"\"\"
                    Mentoring starter
                    Topic: %s
                    Track: %s
                    \"\"\"

                    def run_session(data):
                        return data

                    print(run_session("ready"))
                    """.formatted(topic, humanizeTemplateKey(templateKey));
            case JAVA -> """
                    /**
                     * Mentoring starter
                     * Topic: %s
                     * Track: %s
                     */
                    public class SessionStarter {
                        public static String runSession(String input) {
                            return input;
                        }

                        public static void main(String[] args) {
                            System.out.println(runSession("ready"));
                        }
                    }
                    """.formatted(topic, humanizeTemplateKey(templateKey));
            case CPP -> """
                    #include <iostream>
                    #include <string>

                    // Topic: %s
                    // Track: %s
                    std::string runSession(const std::string& input) {
                        return input;
                    }

                    int main() {
                        std::cout << runSession("ready") << std::endl;
                        return 0;
                    }
                    """.formatted(topic, humanizeTemplateKey(templateKey));
            case GO -> """
                    package main

                    import "fmt"

                    // Topic: %s
                    // Track: %s
                    func runSession(input string) string {
                        return input
                    }

                    func main() {
                        fmt.Println(runSession("ready"))
                    }
                    """.formatted(topic, humanizeTemplateKey(templateKey));
            case TYPESCRIPT -> """
                    /**
                     * Mentoring starter
                     * Topic: %s
                     * Track: %s
                     */
                    function runSession(input: string): string {
                      return input;
                    }

                    console.log(runSession("ready"));
                    """.formatted(topic, humanizeTemplateKey(templateKey));
        };
    }

    private boolean applyMentorUpdates(MentoringSession session, UpdateSessionRequest request) {
        boolean touched = false;

        if (request.topic() != null) {
            session.setTopic(request.topic().trim());
            touched = true;
        }

        if (request.agenda() != null) {
            session.setAgenda(trimToNull(request.agenda()));
            touched = true;
        }

        if (request.scheduledAt() != null) {
            session.setScheduledAt(request.scheduledAt());
            touched = true;
        }

        if (request.durationMinutes() != null) {
            session.setDurationMinutes(resolveDurationMinutes(request.durationMinutes()));
            touched = true;
        }

        if (request.difficulty() != null) {
            session.setDifficulty(request.difficulty());
            touched = true;
        }

        if (request.language() != null) {
            session.setLanguage(request.language());
            touched = true;
        }

        if (request.templateKey() != null) {
            session.setTemplateKey(normalizeTemplateKey(request.templateKey()));
            touched = true;
        }

        if (request.studentGoal() != null) {
            session.setStudentGoal(trimToNull(request.studentGoal()));
            touched = true;
        }

        if (request.mentorNotes() != null) {
            session.setMentorNotes(trimToNull(request.mentorNotes()));
            touched = true;
        }

        if (request.homework() != null) {
            session.setHomework(trimToNull(request.homework()));
            touched = true;
        }

        if (request.resourceLinks() != null) {
            session.setResourceLinks(trimToNull(request.resourceLinks()));
            touched = true;
        }

        if (request.nextSteps() != null) {
            session.setNextSteps(trimToNull(request.nextSteps()));
            touched = true;
        }

        return touched;
    }

    private boolean applyStudentFeedback(MentoringSession session, UpdateSessionRequest request) {
        boolean touched = false;

        if (request.studentRating() != null) {
            session.setStudentRating(request.studentRating());
            touched = true;
        }

        if (request.studentFeedback() != null) {
            session.setStudentFeedback(trimToNull(request.studentFeedback()));
            touched = true;
        }

        if (touched) {
            session.setFeedbackSubmittedAt(Instant.now());
        }

        return touched;
    }

    private void publishMentorWorkspaceEvents(
            MentoringSession session,
            SessionLanguage previousLanguage,
            String previousTemplateKey,
            UpdateSessionRequest request
    ) {
        if (request.language() != null && previousLanguage != session.getLanguage()) {
            publishSystemMessage(
                    session,
                    session.getMentor(),
                    "%s switched the editor language to %s."
                            .formatted(session.getMentor().getDisplayName(), humanizeEnumName(session.getLanguage().name()))
            );
        }

        String normalizedPreviousTemplate = normalizeTemplateKey(previousTemplateKey);
        String normalizedCurrentTemplate = normalizeTemplateKey(session.getTemplateKey());
        if (request.templateKey() != null && !Objects.equals(normalizedPreviousTemplate, normalizedCurrentTemplate)) {
            publishSystemMessage(
                    session,
                    session.getMentor(),
                    "%s loaded the %s starter template."
                            .formatted(session.getMentor().getDisplayName(), humanizeTemplateKey(normalizedCurrentTemplate))
            );
        }
    }

    private void publishStudentFeedbackEvent(MentoringSession session, Instant previousFeedbackSubmittedAt) {
        String feedbackAction = previousFeedbackSubmittedAt == null ? "submitted" : "updated";
        String ratingCopy = session.getStudentRating() != null
                ? " with a %d/5 rating".formatted(session.getStudentRating())
                : "";

        publishSystemMessage(
                session,
                session.getStudent(),
                "%s %s session feedback%s."
                        .formatted(session.getStudent().getDisplayName(), feedbackAction, ratingCopy)
        );
    }

    private void publishSystemMessage(MentoringSession session, User actor, String content) {
        if (actor == null || content == null || content.isBlank()) {
            return;
        }

        ChatMessage message = new ChatMessage();
        message.setId(UUID.randomUUID());
        message.setSession(session);
        message.setSender(actor);
        message.setMessageKind(ChatMessageKind.SYSTEM);
        message.setContent(content.trim());

        ChatMessage savedMessage = chatMessageRepository.save(message);
        messagingTemplate.convertAndSend(
                "/topic/sessions/" + session.getId() + "/chat",
                messageMapper.toResponse(savedMessage)
        );
    }

    private boolean hasMentorOnlyUpdates(UpdateSessionRequest request) {
        return request.topic() != null
                || request.agenda() != null
                || request.scheduledAt() != null
                || request.durationMinutes() != null
                || request.difficulty() != null
                || request.language() != null
                || request.templateKey() != null
                || request.studentGoal() != null
                || request.mentorNotes() != null
                || request.homework() != null
                || request.resourceLinks() != null
                || request.nextSteps() != null;
    }

    private int resolveDurationMinutes(Integer requestedDuration) {
        if (requestedDuration == null || requestedDuration < 15) {
            return 60;
        }

        return requestedDuration;
    }

    private String normalizeTemplateKey(String templateKey) {
        if (templateKey == null || templateKey.isBlank()) {
            return "PAIR_PROGRAMMING";
        }

        return templateKey.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
    }

    private String humanizeTemplateKey(String templateKey) {
        return normalizeTemplateKey(templateKey).replace('_', ' ').toLowerCase(Locale.ROOT);
    }

    private String humanizeEnumName(String value) {
        return value.replace('_', ' ').toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
