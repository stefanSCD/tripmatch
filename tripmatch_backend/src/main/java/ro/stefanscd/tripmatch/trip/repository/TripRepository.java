package ro.stefanscd.tripmatch.trip.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import ro.stefanscd.tripmatch.trip.entity.Trip;

import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {
    Optional<Trip> findTripByIdAndAccountId(Long tripId, Long accountId);
    Page<Trip> findByAccountId(Long accountId, Pageable pageable);
}
