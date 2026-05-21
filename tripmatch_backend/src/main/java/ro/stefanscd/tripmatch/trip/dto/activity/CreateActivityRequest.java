package ro.stefanscd.tripmatch.trip.dto.activity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateActivityRequest {
    @NotBlank
    @Size(max=255)
    private String title;
    @NotBlank
    @Size(max=255)
    private String location;
    @NotNull
    private LocalDate activityDate;
    @NotNull
    private LocalTime startTime;
    @Positive
    private int durationMinutes;
    @NotNull
    @Positive
    private BigDecimal estimatedCost;
    private String notes;
    private BudgetCategory category;
    private Boolean allowOverlap;
}
