package com.mentora.platform.websocket;

import com.mentora.platform.dto.chat.ChatMessageRequest;
import com.mentora.platform.dto.chat.ChatMessageResponse;
import com.mentora.platform.dto.code.CodeSyncRequest;
import com.mentora.platform.dto.code.CodeSyncResponse;
import com.mentora.platform.dto.signal.SignalRequest;
import com.mentora.platform.dto.signal.SignalResponse;
import com.mentora.platform.security.AuthenticatedUserPrincipal;
import com.mentora.platform.service.MessageService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

@Controller
@Validated
public class CollaborationMessageController {

    private static final Logger LOGGER = LoggerFactory.getLogger(CollaborationMessageController.class);

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public CollaborationMessageController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send")
    public void sendChat(@Valid @Payload ChatMessageRequest request, Principal principal) {
        AuthenticatedUserPrincipal currentUser = extractPrincipal(principal);
        ChatMessageResponse response = messageService.saveChatMessage(request, currentUser.getId());
        messagingTemplate.convertAndSend("/topic/sessions/" + request.sessionId() + "/chat", response);
    }

    @MessageMapping("/code.sync")
    public void syncCode(@Valid @Payload CodeSyncRequest request, Principal principal) {
        AuthenticatedUserPrincipal currentUser = extractPrincipal(principal);
        CodeSyncResponse response = messageService.updateCode(request, currentUser.getId());
        messagingTemplate.convertAndSend("/topic/sessions/" + request.sessionId() + "/code", response);
    }

    @MessageMapping("/signal.send")
    public void sendSignal(@Valid @Payload SignalRequest request, Principal principal) {
        AuthenticatedUserPrincipal currentUser = extractPrincipal(principal);
        SignalResponse response = messageService.buildSignalMessage(request, currentUser.getId());
        LOGGER.debug("Forwarding {} signal in session {}", request.signalType(), request.sessionId());
        messagingTemplate.convertAndSend("/topic/sessions/" + request.sessionId() + "/signal", response);
    }

    private AuthenticatedUserPrincipal extractPrincipal(Principal principal) {
        Authentication authentication = (Authentication) principal;
        return (AuthenticatedUserPrincipal) authentication.getPrincipal();
    }
}
