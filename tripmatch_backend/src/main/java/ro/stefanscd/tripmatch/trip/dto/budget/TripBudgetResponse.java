package ro.stefanscd.tripmatch.trip.dto.budget;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TripBudgetResponse {
    Long id;
    Long tripId;
    BigDecimal totalBudget;
    String currency;
    BigDecimal estimatedTotal;
    BigDecimal spentTotal;
    BigDecimal remainingByEstimated;
    BigDecimal remainingBySpent;
    BigDecimal estimatedProgressPct;
    BigDecimal spentProgressPct;
    List<TripBudgetCategoryResponse> categories;
}
