package ro.stefanscd.tripmatch.trip.dto.budget;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class UpsertTripBudgetRequest {
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal totalBudget;

    @NotBlank
    @Size(max = 64)
    private String currency;

    @DecimalMin("0.00")
    private BigDecimal spentTotal;

    @Valid
    @Size(max = 20)
    private List<UpsertTripBudgetCategoryRequest> categories;
}
