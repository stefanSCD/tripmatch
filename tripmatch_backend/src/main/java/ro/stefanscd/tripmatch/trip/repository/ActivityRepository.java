package ro.stefanscd.tripmatch.trip.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ro.stefanscd.tripmatch.trip.entity.Activity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    Optional<Activity> findByIdAndDestinationId(Long id, Long destinationId);
    List<Activity> findByDestinationId(Long destinationId);
    Page<Activity> findByDestinationId(Long destinationId, Pageable pageable);
    List<Activity> findByDestinationIdAndActivityDate(Long destinationId, LocalDate activityDate);
    List<Activity> findByDestinationIdAndActivityDateAndIdNot(Long destinationId, LocalDate activityDate, Long id);
    @Query("""
            select coalesce(max(a.displayOrder), -1)
            from Activity a
            where a.destination.id = :destinationId
              and a.activityDate = :activityDate
            """)
    Integer findMaxDisplayOrderByDestinationIdAndActivityDate(@Param("destinationId") Long destinationId,
                                                               @Param("activityDate") LocalDate activityDate);
    @Query("select coalesce(sum(a.estimatedCost), 0) from Activity a where a.trip.id = :tripId")
    BigDecimal sumEstimatedCostByTripId(@Param("tripId") Long tripId);

    @Query("""
            select a.category as category, coalesce(sum(a.estimatedCost), 0) as estimatedTotal
            from Activity a
            where a.trip.id = :tripId
            group by a.category
            """)
    List<ActivityCategoryEstimatedTotalProjection> sumEstimatedCostByTripIdGroupedByCategory(@Param("tripId") Long tripId);
}
