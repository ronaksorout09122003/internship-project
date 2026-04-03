package com.mentora.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "messages")
public class ChatMessage {

    @jakarta.persistence.Id
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private MentoringSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_kind", nullable = false, length = 30)
    private ChatMessageKind messageKind = ChatMessageKind.CHAT;

    @Column(name = "snippet_title", length = 160)
    private String snippetTitle;

    @Column(name = "snippet_language", length = 30)
    private String snippetLanguage;

    @Column(name = "snippet_code", columnDefinition = "TEXT")
    private String snippetCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public java.util.UUID getId() {
        return id;
    }

    public void setId(java.util.UUID id) {
        this.id = id;
    }

    public MentoringSession getSession() {
        return session;
    }

    public void setSession(MentoringSession session) {
        this.session = session;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public ChatMessageKind getMessageKind() {
        return messageKind;
    }

    public void setMessageKind(ChatMessageKind messageKind) {
        this.messageKind = messageKind;
    }

    public String getSnippetTitle() {
        return snippetTitle;
    }

    public void setSnippetTitle(String snippetTitle) {
        this.snippetTitle = snippetTitle;
    }

    public String getSnippetLanguage() {
        return snippetLanguage;
    }

    public void setSnippetLanguage(String snippetLanguage) {
        this.snippetLanguage = snippetLanguage;
    }

    public String getSnippetCode() {
        return snippetCode;
    }

    public void setSnippetCode(String snippetCode) {
        this.snippetCode = snippetCode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
