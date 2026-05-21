package ro.stefanscd.tripmatch.trip.repository;

import ro.stefanscd.tripmatch.trip.entity.BudgetCategory;

import java.math.BigDecimal;

public interface ActivityCategoryEstimatedTotalProjection {
    BudgetCategory getCategory();
    BigDecimal getEstimatedTotal();
}
