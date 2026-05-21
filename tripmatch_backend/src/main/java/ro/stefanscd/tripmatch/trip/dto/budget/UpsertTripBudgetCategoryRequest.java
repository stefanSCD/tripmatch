package ro.stefanscd.tripmatch.trip.dto.budget;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
public class UpsertTripBudgetCategoryRequest {
    @NotNull
    private BudgetCategory category;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal allocatedAmount;

    @DecimalMin("0.00")
    private BigDecimal spentTotal;
}
