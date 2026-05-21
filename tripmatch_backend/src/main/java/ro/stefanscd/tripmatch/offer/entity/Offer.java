package ro.stefanscd.tripmatch.offer.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.request.entity.TravelRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "offers")
@NoArgsConstructor
@Getter
@Setter
public class Offer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private TravelRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_account_id", nullable = false)
    private Account agency;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 64)
    private String currency;

    @Column(name = "accommodation_details", nullable = false, length = 512)
    private String accommodationDetails;

    @Column(name = "transport_details", nullable = false, length = 512)
    private String transportDetails;

    @Column(name = "itinerary_summary", columnDefinition = "TEXT")
    private String itinerarySummary;

    @Column(columnDefinition = "TEXT")
    private String conditions;

    @Column(name = "attachment_url", length = 1024)
    private String attachmentUrl;

    @Column(name = "feedback_message", columnDefinition = "TEXT")
    private String feedbackMessage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private OfferStatus status;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = OfferStatus.DRAFT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
