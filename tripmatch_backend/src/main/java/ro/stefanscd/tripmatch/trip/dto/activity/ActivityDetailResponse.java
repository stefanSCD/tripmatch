package ro.stefanscd.tripmatch.trip.dto.activity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ro.stefanscd.tripmatch.trip.entity.BudgetCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActivityDetailResponse {
    private Long id;
    private String title;
    private String location;
    private LocalDate activityDate;
    private LocalTime startTime;
    private Integer durationMinutes;
    private Integer displayOrder;
    private BudgetCategory category;
    private BigDecimal estimatedCost;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
