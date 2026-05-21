package ro.stefanscd.tripmatch.trip.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class AiDraftContentDto {
    @NotBlank
    @Size(min = 2, max = 255)
    private String title;

    @Size(max = 4000)
    private String description;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotBlank
    @Size(max = 255)
    private String primaryDestination;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal estimatedTotal;

    @NotBlank
    @Size(max = 64)
    private String currency;

    @NotEmpty
    @Valid
    private List<AiDraftDayDto> days;

    @AssertTrue(message = "endDate cannot be before startDate")
    public boolean isDateRangeValid() {
        if (startDate == null || endDate == null) {
            return true;
        }
        return !endDate.isBefore(startDate);
    }
}
