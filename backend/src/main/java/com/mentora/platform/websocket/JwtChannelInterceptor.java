package com.mentora.platform.websocket;

import com.mentora.platform.security.AuthenticatedUserPrincipal;
import com.mentora.platform.security.JwtService;
import com.mentora.platform.service.SessionService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    static final String AUTHENTICATION_SESSION_ATTRIBUTE = JwtChannelInterceptor.class.getName() + ".AUTHENTICATION";

    private final JwtService jwtService;
    private final SessionService sessionService;

    public JwtChannelInterceptor(JwtService jwtService, SessionService sessionService) {
        this.jwtService = jwtService;
        this.sessionService = sessionService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        StompCommand command = accessor.getCommand();
        Authentication authentication = resolveAuthentication(accessor);

        if (StompCommand.CONNECT.equals(command)) {
            authentication = authenticate(accessor);
        }

        if (StompCommand.SUBSCRIBE.equals(command)) {
            authorizeSubscription(accessor, authentication);
        }

        if ((StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command))
                && authentication == null) {
            throw new AccessDeniedException("WebSocket authentication is required");
        }

        return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
    }

    private Authentication authenticate(StompHeaderAccessor accessor) {
        List<String> authorizationHeaders = accessor.getNativeHeader("Authorization");
        if (authorizationHeaders == null || authorizationHeaders.isEmpty()) {
            throw new AccessDeniedException("Missing WebSocket Authorization header");
        }

        String authorizationHeader = authorizationHeaders.getFirst();
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new AccessDeniedException("Invalid WebSocket Authorization header");
        }

        String token = authorizationHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            throw new AccessDeniedException("Invalid WebSocket token");
        }

        AuthenticatedUserPrincipal principal = jwtService.parseToken(token);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.getAuthorities()
        );
        accessor.setUser(authentication);
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put(AUTHENTICATION_SESSION_ATTRIBUTE, authentication);
        }
        return authentication;
    }

    private void authorizeSubscription(StompHeaderAccessor accessor, Authentication authentication) {
        if (authentication == null || accessor.getDestination() == null) {
            return;
        }

        String destination = accessor.getDestination();
        if (!destination.startsWith("/topic/sessions/")) {
            return;
        }

        String[] segments = destination.split("/");
        if (segments.length < 4) {
            return;
        }

        UUID sessionId = UUID.fromString(segments[3]);
        AuthenticatedUserPrincipal principal = (AuthenticatedUserPrincipal) authentication.getPrincipal();

        try {
            sessionService.ensureParticipant(sessionId, principal.getId());
        } catch (AccessDeniedException | com.mentora.platform.exception.ForbiddenException e) {
            throw new AccessDeniedException(e.getMessage());
        }
    }

    private Authentication resolveAuthentication(StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof Authentication authentication) {
            return authentication;
        }

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes == null) {
            return null;
        }

        Object authentication = sessionAttributes.get(AUTHENTICATION_SESSION_ATTRIBUTE);
        if (authentication instanceof Authentication restoredAuthentication) {
            accessor.setUser(restoredAuthentication);
            return restoredAuthentication;
        }

        return null;
    }
}
