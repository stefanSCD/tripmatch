package ro.stefanscd.tripmatch.notification.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ro.stefanscd.tripmatch.notification.dto.MarkNotificationsReadRequest;
import ro.stefanscd.tripmatch.notification.dto.NotificationListItemResponse;
import ro.stefanscd.tripmatch.notification.dto.NotificationResponse;
import ro.stefanscd.tripmatch.notification.dto.UnreadNotificationsCountResponse;
import ro.stefanscd.tripmatch.notification.service.NotificationService;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;

@RestController
@Validated
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<NotificationListItemResponse>> getMyNotifications(
            Authentication authentication,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(notificationService.getMyNotifications(authentication.getName(), pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadNotificationsCountResponse> getUnreadCount(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getUnreadCount(authentication.getName()));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable @Positive Long notificationId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(notificationId, authentication.getName()));
    }

    @PatchMapping("/read")
    public ResponseEntity<NotificationResponse> markManyAsRead(
            @RequestBody @Valid MarkNotificationsReadRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(notificationService.markManyAsRead(request, authentication.getName()));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<NotificationResponse> markAllAsRead(Authentication authentication) {
        return ResponseEntity.ok(notificationService.markAllAsRead(authentication.getName()));
    }
}
