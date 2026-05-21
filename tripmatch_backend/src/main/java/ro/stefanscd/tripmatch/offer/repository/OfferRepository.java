package ro.stefanscd.tripmatch.offer.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ro.stefanscd.tripmatch.offer.entity.Offer;
import ro.stefanscd.tripmatch.offer.entity.OfferStatus;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    Optional<Offer> findByIdAndAgencyId(Long offerId, Long agencyId);

    Optional<Offer> findByIdAndRequestAccountId(Long offerId, Long userAccountId);

    Page<Offer> findByAgencyId(Long agencyId, Pageable pageable);

    Page<Offer> findByRequestAccountId(Long userAccountId, Pageable pageable);

    boolean existsByRequestIdAndAgencyId(Long requestId, Long agencyId);

    boolean existsByRequestIdAndAgencyIdAndStatus(Long requestId, Long agencyId, OfferStatus status);

    boolean existsByRequestIdAndStatus(Long requestId, OfferStatus status);

    List<Offer> findByRequestId(Long requestId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Offer o where o.request.id = :requestId")
    List<Offer> findByRequestIdForUpdate(@Param("requestId") Long requestId);
}
