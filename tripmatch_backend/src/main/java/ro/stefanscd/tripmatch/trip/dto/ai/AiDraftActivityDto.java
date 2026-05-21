package ro.stefanscd.tripmatch.trip.dto.ai;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiDraftActivityDto {
    @NotBlank
    @Size(max = 255)
    private String title;

    @NotBlank
    @Size(max = 255)
    private String location;

    @NotNull
    private LocalDate activityDate;

    @NotNull
    private LocalTime startTime;

    @NotNull
    @Positive
    private Integer durationMinutes;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal estimatedCost;

    @Size(max = 2000)
    private String notes;
}
