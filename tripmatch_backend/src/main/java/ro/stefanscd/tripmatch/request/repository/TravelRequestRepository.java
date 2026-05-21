package ro.stefanscd.tripmatch.request.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ro.stefanscd.tripmatch.request.entity.TravelRequest;
import ro.stefanscd.tripmatch.request.entity.TravelRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

import java.util.Optional;

public interface TravelRequestRepository extends JpaRepository<TravelRequest, Long> {
    Optional<TravelRequest> findByIdAndAccountId(Long requestId, Long accountId);

    Optional<TravelRequest> findByTripId(Long tripId);

    Optional<TravelRequest> findByIdAndStatus(Long requestId, TravelRequestStatus status);

    Page<TravelRequest> findByAccountIdOrderByPublishedAtDesc(Long accountId, Pageable pageable);

    Page<TravelRequest> findByAccountIdAndStatusNotOrderByPublishedAtDesc(
            Long accountId,
            TravelRequestStatus status,
            Pageable pageable
    );

    Optional<TravelRequest> findByIdAndAccountIdAndStatusNot(
            Long requestId,
            Long accountId,
            TravelRequestStatus status
    );

    @Query("""
            select tr
            from TravelRequest tr
            where tr.status = :status
              and (:minBudget is null or tr.budgetMax >= :minBudget)
              and (:maxBudget is null or tr.budgetMin <= :maxBudget)
              and (:startFrom is null or tr.endDate >= :startFrom)
              and (:endTo is null or tr.startDate <= :endTo)
              and (:flexibleDate is null or tr.isFlexibleDate = :flexibleDate)
            order by tr.publishedAt desc
            """)
    Page<TravelRequest> findByStatusWithFilters(
            @Param("status") TravelRequestStatus status,
            @Param("minBudget") BigDecimal minBudget,
            @Param("maxBudget") BigDecimal maxBudget,
            @Param("startFrom") LocalDate startFrom,
            @Param("endTo") LocalDate endTo,
            @Param("flexibleDate") Boolean flexibleDate,
            Pageable pageable
    );

    @Query("""
            select tr
            from TravelRequest tr
            where tr.status = :status
              and lower(tr.destinationSummary) like lower(concat('%', :destination, '%'))
              and (:minBudget is null or tr.budgetMax >= :minBudget)
              and (:maxBudget is null or tr.budgetMin <= :maxBudget)
              and (:startFrom is null or tr.endDate >= :startFrom)
              and (:endTo is null or tr.startDate <= :endTo)
              and (:flexibleDate is null or tr.isFlexibleDate = :flexibleDate)
            order by tr.publishedAt desc
            """)
    Page<TravelRequest> searchByStatusAndDestinationWithFilters(
            @Param("status") TravelRequestStatus status,
            @Param("destination") String destination,
            @Param("minBudget") BigDecimal minBudget,
            @Param("maxBudget") BigDecimal maxBudget,
            @Param("startFrom") LocalDate startFrom,
            @Param("endTo") LocalDate endTo,
            @Param("flexibleDate") Boolean flexibleDate,
            Pageable pageable
    );
}
