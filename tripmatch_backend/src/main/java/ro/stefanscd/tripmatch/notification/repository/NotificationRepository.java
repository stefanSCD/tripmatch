package ro.stefanscd.tripmatch.notification.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import ro.stefanscd.tripmatch.notification.entity.Notification;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByAccountIdOrderByCreatedAtDesc(Long accountId, Pageable pageable);

    long countByAccountIdAndIsReadFalse(Long accountId);

    Optional<Notification> findByIdAndAccountId(Long id, Long accountId);

    List<Notification> findByIdInAndAccountId(List<Long> ids, Long accountId);

    List<Notification> findByAccountIdAndIsReadFalse(Long accountId);
}
