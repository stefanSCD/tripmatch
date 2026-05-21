package ro.stefanscd.tripmatch.trip.dto.ai;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class GenerateAiDraftRequest {
    @Size(max = 255)
    private String destinationHint;

    @Size(max = 100)
    private String tripType;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal budgetTotal;

    @NotBlank
    @Size(max = 64)
    private String currency;

    @Size(max = 20)
    private List<@NotBlank @Size(max = 100) String> interests;

    @NotBlank
    @Size(max = 32)
    private String pace;

    @Size(max = 2000)
    private String notes;

    @AssertTrue(message = "Either destinationHint or tripType must be provided")
    public boolean isDestinationOrTypeProvided() {
        return hasText(destinationHint) || hasText(tripType);
    }

    @AssertTrue(message = "endDate cannot be before startDate")
    public boolean isDateRangeValid() {
        if (startDate == null || endDate == null) {
            return true;
        }
        return !endDate.isBefore(startDate);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
