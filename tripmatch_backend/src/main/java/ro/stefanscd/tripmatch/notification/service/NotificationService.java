package ro.stefanscd.tripmatch.notification.service;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.common.exception.NotFoundException;
import ro.stefanscd.tripmatch.notification.dto.MarkNotificationsReadRequest;
import ro.stefanscd.tripmatch.notification.dto.NotificationListItemResponse;
import ro.stefanscd.tripmatch.notification.dto.NotificationResponse;
import ro.stefanscd.tripmatch.notification.dto.UnreadNotificationsCountResponse;
import ro.stefanscd.tripmatch.notification.entity.Notification;
import ro.stefanscd.tripmatch.notification.entity.NotificationType;
import ro.stefanscd.tripmatch.notification.repository.NotificationRepository;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final AccountRepository accountRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               AccountRepository accountRepository) {
        this.notificationRepository = notificationRepository;
        this.accountRepository = accountRepository;
    }

    public void createNotification(Account recipient,
                                   NotificationType type,
                                   String title,
                                   String message) {
        Notification notification = new Notification();
        notification.setAccount(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setIsRead(false);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationListItemResponse> getMyNotifications(String email, Pageable pageable) {
        Account account = findAccountByEmail(email);

        var page = notificationRepository.findByAccountIdOrderByCreatedAtDesc(account.getId(), pageable);

        return PageResponse.from(page.map(this::toNotificationListItemResponse));
    }

    @Transactional(readOnly = true)
    public UnreadNotificationsCountResponse getUnreadCount(String email) {
        Account account = findAccountByEmail(email);

        long count = notificationRepository.countByAccountIdAndIsReadFalse(account.getId());
        return new UnreadNotificationsCountResponse(count);
    }

    public NotificationResponse markAsRead(Long notificationId, String email) {
        Account account = findAccountByEmail(email);
        Notification notification = notificationRepository.findByIdAndAccountId(notificationId, account.getId())
                .orElseThrow(() -> new NotFoundException("Notification not found!"));

        if (Boolean.TRUE.equals(notification.getIsRead())) {
            return new NotificationResponse(notification.getId(), "Notification already marked as read.");
        }

        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);

        return new NotificationResponse(notification.getId(), "Notification marked as read.");
    }

    public NotificationResponse markManyAsRead(MarkNotificationsReadRequest request,
                                               String email) {
        Account account = findAccountByEmail(email);

        LinkedHashSet<Long> uniqueIds = new LinkedHashSet<>(request.getNotificationIds());
        List<Notification> notifications = notificationRepository.findByIdInAndAccountId(new ArrayList<>(uniqueIds), account.getId());

        if (notifications.size() != uniqueIds.size()) {
            throw new NotFoundException("One or more notifications were not found.");
        }

        LocalDateTime now = LocalDateTime.now();
        int updatedCount = 0;
        for (Notification notification : notifications) {
            if (!Boolean.TRUE.equals(notification.getIsRead())) {
                notification.setIsRead(true);
                notification.setReadAt(now);
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            notificationRepository.saveAll(notifications);
        }

        return new NotificationResponse(
                null,
                updatedCount > 0
                        ? "Selected notifications marked as read."
                        : "All selected notifications are already read."
        );
    }

    public NotificationResponse markAllAsRead(String email) {
        Account account = findAccountByEmail(email);
        List<Notification> unreadNotifications = notificationRepository.findByAccountIdAndIsReadFalse(account.getId());

        if (unreadNotifications.isEmpty()) {
            return new NotificationResponse(null, "All notifications are already read.");
        }

        LocalDateTime now = LocalDateTime.now();
        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
            notification.setReadAt(now);
        }

        notificationRepository.saveAll(unreadNotifications);
        return new NotificationResponse(null, "All notifications marked as read.");
    }

    private Account findAccountByEmail(String email) {
        return accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found!"));
    }

    private NotificationListItemResponse toNotificationListItemResponse(Notification notification) {
        return new NotificationListItemResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getIsRead(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}
