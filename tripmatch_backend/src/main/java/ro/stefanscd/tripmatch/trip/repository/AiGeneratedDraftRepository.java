package ro.stefanscd.tripmatch.trip.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import ro.stefanscd.tripmatch.trip.entity.AiGeneratedDraft;

import java.util.Optional;

public interface AiGeneratedDraftRepository extends JpaRepository<AiGeneratedDraft, Long> {
    Optional<AiGeneratedDraft> findByIdAndAccountId(Long id, Long accountId);
    Page<AiGeneratedDraft> findByAccountId(Long accountId, Pageable pageable);
    long deleteByIdAndAccountId(Long id, Long accountId);
}
