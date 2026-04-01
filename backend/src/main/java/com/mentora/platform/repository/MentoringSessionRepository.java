package com.mentora.platform.repository;

import com.mentora.platform.entity.MentoringSession;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentoringSessionRepository extends JpaRepository<MentoringSession, UUID> {

    boolean existsBySessionCode(String sessionCode);

    Optional<MentoringSession> findBySessionCodeIgnoreCase(String sessionCode);

    List<MentoringSession> findByMentorIdOrderByCreatedAtDesc(UUID mentorId);

    List<MentoringSession> findByStudentIdOrderByCreatedAtDesc(UUID studentId);
}
