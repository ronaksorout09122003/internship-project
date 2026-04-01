package com.mentora.platform.repository;

import com.mentora.platform.entity.CodeSnapshot;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CodeSnapshotRepository extends JpaRepository<CodeSnapshot, UUID> {

    Optional<CodeSnapshot> findBySessionId(UUID sessionId);
}
