package ro.stefanscd.tripmatch.trip.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.stefanscd.tripmatch.trip.entity.BudgetCategory;
import ro.stefanscd.tripmatch.trip.entity.TripBudgetCategory;

import java.util.List;
import java.util.Optional;

public interface TripBudgetCategoryRepository extends JpaRepository<TripBudgetCategory, Long> {
    List<TripBudgetCategory> findByTripBudgetId(Long tripBudgetId);
    Optional<TripBudgetCategory> findByTripBudgetIdAndCategory(Long tripBudgetId, BudgetCategory category);
}
