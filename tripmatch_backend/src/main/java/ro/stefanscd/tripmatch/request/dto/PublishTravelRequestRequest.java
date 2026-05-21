package ro.stefanscd.tripmatch.request.dto;

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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PublishTravelRequestRequest {
    @NotBlank
    @Size(max = 4000)
    private String sharedPreferences;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal budgetMin;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal budgetMax;

    @NotBlank
    @Size(max = 512)
    private String destinationSummary;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotNull
    private Boolean isFlexibleDate;

    @AssertTrue(message = "budgetMin must be less than or equal to budgetMax")
    public boolean isBudgetRangeValid() {
        if (budgetMin == null || budgetMax == null) {
            return true;
        }
        return budgetMin.compareTo(budgetMax) <= 0;
    }

    @AssertTrue(message = "endDate must be after or equal to startDate")
    public boolean isDateRangeValid() {
        if (startDate == null || endDate == null) {
            return true;
        }
        return !endDate.isBefore(startDate);
    }
}
