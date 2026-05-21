package ro.stefanscd.tripmatch.trip.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiDraftDayDto {
    @NotNull
    @Positive
    private Integer dayNumber;

    @NotNull
    private LocalDate date;

    @Size(max = 2000)
    private String summary;

    @DecimalMin("0.00")
    private BigDecimal estimatedCostTotal;

    @NotEmpty
    @Valid
    private List<AiDraftActivityDto> activities;
}
