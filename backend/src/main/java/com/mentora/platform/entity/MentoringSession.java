package com.mentora.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "sessions")
public class MentoringSession extends BaseEntity {

    @Column(name = "session_code", nullable = false, unique = true, length = 32)
    private String sessionCode;

    @Column(nullable = false, length = 140)
    private String topic;

    @Column(length = 1600)
    private String agenda;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SessionDifficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SessionLanguage language;

    @Column(name = "template_key", length = 60)
    private String templateKey;

    @Column(name = "student_goal", length = 1600)
    private String studentGoal;

    @Column(name = "mentor_notes", length = 4000)
    private String mentorNotes;

    @Column(length = 2400)
    private String homework;

    @Column(name = "resource_links", length = 2400)
    private String resourceLinks;

    @Column(name = "next_steps", length = 2400)
    private String nextSteps;

    @Column(name = "student_rating")
    private Integer studentRating;

    @Column(name = "student_feedback", length = 2000)
    private String studentFeedback;

    @Column(name = "feedback_submitted_at")
    private Instant feedbackSubmittedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SessionStatus status;

    public String getSessionCode() {
        return sessionCode;
    }

    public void setSessionCode(String sessionCode) {
        this.sessionCode = sessionCode;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getAgenda() {
        return agenda;
    }

    public void setAgenda(String agenda) {
        this.agenda = agenda;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(Instant scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public SessionDifficulty getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(SessionDifficulty difficulty) {
        this.difficulty = difficulty;
    }

    public SessionLanguage getLanguage() {
        return language;
    }

    public void setLanguage(SessionLanguage language) {
        this.language = language;
    }

    public String getTemplateKey() {
        return templateKey;
    }

    public void setTemplateKey(String templateKey) {
        this.templateKey = templateKey;
    }

    public String getStudentGoal() {
        return studentGoal;
    }

    public void setStudentGoal(String studentGoal) {
        this.studentGoal = studentGoal;
    }

    public String getMentorNotes() {
        return mentorNotes;
    }

    public void setMentorNotes(String mentorNotes) {
        this.mentorNotes = mentorNotes;
    }

    public String getHomework() {
        return homework;
    }

    public void setHomework(String homework) {
        this.homework = homework;
    }

    public String getResourceLinks() {
        return resourceLinks;
    }

    public void setResourceLinks(String resourceLinks) {
        this.resourceLinks = resourceLinks;
    }

    public String getNextSteps() {
        return nextSteps;
    }

    public void setNextSteps(String nextSteps) {
        this.nextSteps = nextSteps;
    }

    public Integer getStudentRating() {
        return studentRating;
    }

    public void setStudentRating(Integer studentRating) {
        this.studentRating = studentRating;
    }

    public String getStudentFeedback() {
        return studentFeedback;
    }

    public void setStudentFeedback(String studentFeedback) {
        this.studentFeedback = studentFeedback;
    }

    public Instant getFeedbackSubmittedAt() {
        return feedbackSubmittedAt;
    }

    public void setFeedbackSubmittedAt(Instant feedbackSubmittedAt) {
        this.feedbackSubmittedAt = feedbackSubmittedAt;
    }

    public User getMentor() {
        return mentor;
    }

    public void setMentor(User mentor) {
        this.mentor = mentor;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }
}
