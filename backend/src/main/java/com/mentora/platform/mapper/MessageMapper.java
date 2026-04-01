package com.mentora.platform.mapper;

import com.mentora.platform.dto.chat.ChatMessageResponse;
import com.mentora.platform.entity.ChatMessage;
import org.springframework.stereotype.Component;

@Component
public class MessageMapper {

    public ChatMessageResponse toResponse(ChatMessage message) {
        return new ChatMessageResponse(
                "CHAT_MESSAGE",
                message.getId(),
                message.getSession().getId(),
                message.getSender().getId(),
                message.getSender().getEmail(),
                message.getSender().getRole(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
