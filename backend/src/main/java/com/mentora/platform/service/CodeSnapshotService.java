package com.mentora.platform.service;

import com.mentora.platform.entity.CodeSnapshot;
import com.mentora.platform.entity.MentoringSession;
import com.mentora.platform.repository.CodeSnapshotRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CodeSnapshotService {

    private final CodeSnapshotRepository codeSnapshotRepository;

    public CodeSnapshotService(CodeSnapshotRepository codeSnapshotRepository) {
        this.codeSnapshotRepository = codeSnapshotRepository;
    }

    @Transactional(readOnly = true)
    public Optional<CodeSnapshot> findBySessionId(UUID sessionId) {
        return codeSnapshotRepository.findBySessionId(sessionId);
    }

    @Transactional
    public CodeSnapshot initializeSnapshot(MentoringSession session, String initialCode) {
        CodeSnapshot snapshot = new CodeSnapshot();
        snapshot.setId(UUID.randomUUID());
        snapshot.setSession(session);
        snapshot.setCode(initialCode);
        return codeSnapshotRepository.save(snapshot);
    }

    @Transactional
    public CodeSnapshot updateCode(MentoringSession session, String code) {
        CodeSnapshot snapshot = codeSnapshotRepository.findBySessionId(session.getId())
                .orElseGet(() -> initializeSnapshot(session, code));
        snapshot.setCode(code);
        return codeSnapshotRepository.save(snapshot);
    }
}
