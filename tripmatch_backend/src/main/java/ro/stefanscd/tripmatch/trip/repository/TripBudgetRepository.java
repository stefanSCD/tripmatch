package ro.stefanscd.tripmatch.trip.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.stefanscd.tripmatch.trip.entity.TripBudget;

import java.util.Optional;

public interface TripBudgetRepository extends JpaRepository<TripBudget, Long> {
    Optional<TripBudget> findByTripId(Long tripId);
}
