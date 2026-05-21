package ro.stefanscd.tripmatch.request.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
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
public class TravelRequestFilterRequest {
    @Size(max = 512)
    private String destination;

    @DecimalMin("0.00")
    private BigDecimal minBudget;

    @DecimalMin("0.00")
    private BigDecimal maxBudget;

    private LocalDate startFrom;

    private LocalDate endTo;

    private Boolean flexibleDate;

    @AssertTrue(message = "minBudget must be less than or equal to maxBudget")
    public boolean isBudgetRangeValid() {
        if (minBudget == null || maxBudget == null) {
            return true;
        }
        return minBudget.compareTo(maxBudget) <= 0;
    }

    @AssertTrue(message = "startFrom must be before or equal to endTo")
    public boolean isDateRangeValid() {
        if (startFrom == null || endTo == null) {
            return true;
        }
        return !startFrom.isAfter(endTo);
    }
}
