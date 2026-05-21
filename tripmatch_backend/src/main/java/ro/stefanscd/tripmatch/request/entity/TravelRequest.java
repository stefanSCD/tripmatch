package ro.stefanscd.tripmatch.request.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.trip.entity.Trip;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "travel_requests")
@NoArgsConstructor
@Getter
@Setter
public class TravelRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false, unique = true)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_account_id", nullable = false)
    private Account account;

    @Column(name = "shared_preferences", columnDefinition = "TEXT", nullable = false)
    private String sharedPreferences;

    @Column(name = "budget_min", nullable = false, precision = 12, scale = 2)
    private BigDecimal budgetMin;

    @Column(name = "budget_max", nullable = false, precision = 12, scale = 2)
    private BigDecimal budgetMax;

    @Column(name = "destination_summary", nullable = false, length = 512)
    private String destinationSummary;

    @Column(name = "travel_start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "travel_end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_flexible_date", nullable = false)
    private Boolean isFlexibleDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private TravelRequestStatus status;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        publishedAt = LocalDateTime.now();
        if (isFlexibleDate == null)
            isFlexibleDate = false;
        if (status == null)
            status = TravelRequestStatus.PUBLISHED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
