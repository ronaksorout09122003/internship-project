package com.mentora.platform.controller;

import com.mentora.platform.dto.chat.ChatMessageResponse;
import com.mentora.platform.dto.session.CreateSessionRequest;
import com.mentora.platform.dto.session.EndSessionRequest;
import com.mentora.platform.dto.session.JoinSessionRequest;
import com.mentora.platform.dto.session.SessionResponse;
import com.mentora.platform.dto.session.SessionSummaryResponse;
import com.mentora.platform.dto.session.UpdateSessionRequest;
import com.mentora.platform.security.AuthenticatedUserPrincipal;
import com.mentora.platform.service.MessageService;
import com.mentora.platform.service.SessionService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;
    private final MessageService messageService;

    public SessionController(SessionService sessionService, MessageService messageService) {
        this.sessionService = sessionService;
        this.messageService = messageService;
    }

    @PostMapping
    public ResponseEntity<SessionResponse> createSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CreateSessionRequest request
    ) {
        return ResponseEntity.status(201).body(sessionService.createSession(principal.getId(), request));
    }

    @PostMapping("/create")
    public ResponseEntity<SessionResponse> createSessionAlias(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CreateSessionRequest request
    ) {
        return ResponseEntity.status(201).body(sessionService.createSession(principal.getId(), request));
    }

    @PostMapping("/{sessionId}/join")
    public ResponseEntity<SessionResponse> joinSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID sessionId
    ) {
        return ResponseEntity.ok(sessionService.joinSession(sessionId, principal.getId()));
    }

    @PostMapping("/join")
    public ResponseEntity<SessionResponse> joinSessionAlias(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody JoinSessionRequest request
    ) {
        return ResponseEntity.ok(sessionService.joinSession(request.sessionId(), request.sessionCode(), principal.getId()));
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<SessionResponse> endSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID sessionId
    ) {
        return ResponseEntity.ok(sessionService.endSession(sessionId, principal.getId()));
    }

    @PostMapping("/end")
    public ResponseEntity<SessionResponse> endSessionAlias(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody EndSessionRequest request
    ) {
        return ResponseEntity.ok(sessionService.endSession(request.sessionId(), principal.getId()));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> getSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID sessionId
    ) {
        return ResponseEntity.ok(sessionService.getSession(sessionId, principal.getId()));
    }

    @GetMapping
    public ResponseEntity<List<SessionSummaryResponse>> getMySessions(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        return ResponseEntity.ok(sessionService.listMySessions(principal.getId()));
    }

    @PatchMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> updateSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID sessionId,
            @Valid @RequestBody UpdateSessionRequest request
    ) {
        return ResponseEntity.ok(sessionService.updateSession(sessionId, principal.getId(), request));
    }

    @GetMapping("/{sessionId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID sessionId
    ) {
        return ResponseEntity.ok(messageService.getChatHistory(sessionId, principal.getId()));
    }
}
