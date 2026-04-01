package com.mentora.platform.websocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mentora.platform.entity.Role;
import com.mentora.platform.security.AuthenticatedUserPrincipal;
import com.mentora.platform.security.JwtService;
import com.mentora.platform.service.SessionService;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class JwtChannelInterceptorTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private SessionService sessionService;

    private JwtChannelInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new JwtChannelInterceptor(jwtService, sessionService);
    }

    @Test
    void subscribeShouldReuseAuthenticatedUserStoredDuringConnect() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                userId,
                "mentor@mentora.dev",
                "",
                Role.MENTOR
        );
        Map<String, Object> sessionAttributes = new HashMap<>();

        when(jwtService.isTokenValid("test-token")).thenReturn(true);
        when(jwtService.parseToken("test-token")).thenReturn(principal);

        Message<?> connectMessage = buildConnectMessage(sessionAttributes, "Bearer test-token");
        Message<?> connectedMessage = interceptor.preSend(connectMessage, mock(MessageChannel.class));
        StompHeaderAccessor connectedAccessor = StompHeaderAccessor.wrap(connectedMessage);

        assertThat(connectedAccessor.getUser()).isInstanceOf(Authentication.class);
        assertThat(sessionAttributes)
                .containsKey(JwtChannelInterceptor.AUTHENTICATION_SESSION_ATTRIBUTE);

        Message<?> subscribeMessage = buildSubscribeMessage(sessionAttributes, sessionId);
        Message<?> authorizedMessage = interceptor.preSend(subscribeMessage, mock(MessageChannel.class));
        StompHeaderAccessor authorizedAccessor = StompHeaderAccessor.wrap(authorizedMessage);

        assertThat(authorizedAccessor.getUser()).isInstanceOf(Authentication.class);
        verify(sessionService).ensureParticipant(sessionId, userId);
    }

    private Message<?> buildConnectMessage(Map<String, Object> sessionAttributes, String authorizationHeader) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setSessionAttributes(sessionAttributes);
        accessor.addNativeHeader("Authorization", authorizationHeader);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Message<?> buildSubscribeMessage(Map<String, Object> sessionAttributes, UUID sessionId) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setSessionAttributes(sessionAttributes);
        accessor.setDestination("/topic/sessions/" + sessionId + "/chat");
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
