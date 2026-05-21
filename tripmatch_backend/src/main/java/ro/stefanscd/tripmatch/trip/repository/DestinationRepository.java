package ro.stefanscd.tripmatch.trip.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import ro.stefanscd.tripmatch.trip.entity.Destination;

import java.util.Optional;

public interface DestinationRepository extends JpaRepository<Destination, Long> {
    Optional<Destination> findByIdAndTripId(Long id, Long tripId);
    Page<Destination> findByTripId(Long tripId, Pageable pageable);
}
