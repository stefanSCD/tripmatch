package ro.stefanscd.tripmatch.trip.dto.budget;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ro.stefanscd.tripmatch.trip.entity.BudgetCategory;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TripBudgetCategoryResponse {
    private BudgetCategory category;
    private BigDecimal allocatedAmount;
    private BigDecimal estimatedTotal;
    private BigDecimal spentTotal;
    private BigDecimal remainingByEstimated;
    private BigDecimal remainingBySpent;
    private BigDecimal estimatedProgressPct;
    private BigDecimal spentProgressPct;
}
