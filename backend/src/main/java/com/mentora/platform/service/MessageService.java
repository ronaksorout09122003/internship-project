package com.mentora.platform.service;

import com.mentora.platform.dto.chat.ChatMessageRequest;
import com.mentora.platform.dto.chat.ChatMessageResponse;
import com.mentora.platform.dto.code.CodeSyncRequest;
import com.mentora.platform.dto.code.CodeSyncResponse;
import com.mentora.platform.dto.signal.SignalRequest;
import com.mentora.platform.dto.signal.SignalResponse;
import com.mentora.platform.entity.ChatMessage;
import com.mentora.platform.entity.ChatMessageKind;
import com.mentora.platform.entity.CodeSnapshot;
import com.mentora.platform.entity.MentoringSession;
import com.mentora.platform.entity.User;
import com.mentora.platform.mapper.MessageMapper;
import com.mentora.platform.repository.ChatMessageRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final MessageMapper messageMapper;
    private final SessionService sessionService;
    private final UserService userService;
    private final CodeSnapshotService codeSnapshotService;

    public MessageService(
            ChatMessageRepository chatMessageRepository,
            MessageMapper messageMapper,
            SessionService sessionService,
            UserService userService,
            CodeSnapshotService codeSnapshotService
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.messageMapper = messageMapper;
        this.sessionService = sessionService;
        this.userService = userService;
        this.codeSnapshotService = codeSnapshotService;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getChatHistory(UUID sessionId, UUID requesterId) {
        sessionService.ensureParticipant(sessionId, requesterId);
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).stream()
                .map(messageMapper::toResponse)
                .toList();
    }

    @Transactional
    public ChatMessageResponse saveChatMessage(ChatMessageRequest request, UUID senderId) {
        MentoringSession session = sessionService.getSessionEntity(request.sessionId());
        sessionService.ensureParticipant(session, senderId);
        User sender = userService.getEntityById(senderId);
        String content = trimToNull(request.content());
        String snippetCode = normalizeSnippetCode(request.snippetCode());

        if (content == null && snippetCode == null) {
            throw new IllegalArgumentException("Message content or snippet is required");
        }

        ChatMessage message = new ChatMessage();
        message.setId(UUID.randomUUID());
        message.setSession(session);
        message.setSender(sender);
        message.setMessageKind(snippetCode != null ? ChatMessageKind.CODE_SNIPPET : ChatMessageKind.CHAT);
        message.setContent(content != null ? content : "Shared a code snippet");
        message.setSnippetTitle(trimToNull(request.snippetTitle()));
        message.setSnippetLanguage(trimToNull(request.snippetLanguage()));
        message.setSnippetCode(snippetCode);

        return messageMapper.toResponse(chatMessageRepository.save(message));
    }

    @Transactional
    public CodeSyncResponse updateCode(CodeSyncRequest request, UUID senderId) {
        MentoringSession session = sessionService.getSessionEntity(request.sessionId());
        sessionService.ensureParticipant(session, senderId);
        CodeSnapshot snapshot = codeSnapshotService.updateCode(session, request.code());
        return new CodeSyncResponse(
                "CODE_SYNC",
                session.getId(),
                senderId,
                snapshot.getCode(),
                snapshot.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public SignalResponse buildSignalMessage(SignalRequest request, UUID senderId) {
        MentoringSession session = sessionService.getSessionEntity(request.sessionId());
        sessionService.ensureParticipant(session, senderId);
        User sender = userService.getEntityById(senderId);

        return new SignalResponse(
                "SIGNAL",
                request.sessionId(),
                request.signalType(),
                sender.getId(),
                sender.getEmail(),
                sender.getRole(),
                request.payload() == null ? Map.of() : request.payload(),
                Instant.now()
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeSnippetCode(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.replace("\r\n", "\n");
        while (normalized.startsWith("\n")) {
            normalized = normalized.substring(1);
        }
        while (normalized.endsWith("\n")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized.isBlank() ? null : normalized;
    }
}
