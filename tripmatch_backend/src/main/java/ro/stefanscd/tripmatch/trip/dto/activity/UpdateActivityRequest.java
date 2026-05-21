package ro.stefanscd.tripmatch.trip.dto.activity;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ro.stefanscd.tripmatch.trip.entity.BudgetCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateActivityRequest {
    @Size(max = 255)
    private String title;
    @Size(max = 255)
    private String location;
    private LocalDate activityDate;
    private LocalTime startTime;
    @Positive
    private Integer durationMinutes;
    @Positive
    private BigDecimal estimatedCost;
    private String notes;
    private BudgetCategory category;
    private Boolean allowOverlap;
}
