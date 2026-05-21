package ro.stefanscd.tripmatch.request.service;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.common.exception.BadRequestException;
import ro.stefanscd.tripmatch.common.exception.ForbiddenException;
import ro.stefanscd.tripmatch.common.exception.NotFoundException;
import ro.stefanscd.tripmatch.offer.entity.Offer;
import ro.stefanscd.tripmatch.offer.entity.OfferStatus;
import ro.stefanscd.tripmatch.offer.repository.OfferRepository;
import ro.stefanscd.tripmatch.request.dto.PublishTravelRequestRequest;
import ro.stefanscd.tripmatch.request.dto.TravelRequestDetailResponse;
import ro.stefanscd.tripmatch.request.dto.TravelRequestFilterRequest;
import ro.stefanscd.tripmatch.request.dto.TravelRequestListItemResponse;
import ro.stefanscd.tripmatch.request.dto.TravelRequestResponse;
import ro.stefanscd.tripmatch.request.entity.TravelRequest;
import ro.stefanscd.tripmatch.request.entity.TravelRequestStatus;
import ro.stefanscd.tripmatch.request.repository.TravelRequestRepository;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;
import ro.stefanscd.tripmatch.trip.entity.Trip;
import ro.stefanscd.tripmatch.trip.entity.TripStatus;
import ro.stefanscd.tripmatch.trip.repository.TripRepository;

import java.time.LocalDateTime;

@Service
@Transactional
public class TravelRequestService {
    private final TravelRequestRepository travelRequestRepository;
    private final TripRepository tripRepository;
    private final AccountRepository accountRepository;
    private final OfferRepository offerRepository;

    public TravelRequestService(TravelRequestRepository travelRequestRepository,
                                TripRepository tripRepository,
                                AccountRepository accountRepository,
                                OfferRepository offerRepository) {
        this.travelRequestRepository = travelRequestRepository;
        this.tripRepository = tripRepository;
        this.accountRepository = accountRepository;
        this.offerRepository = offerRepository;
    }

    public TravelRequestResponse publishTravelRequest(Long tripId,
                                                      PublishTravelRequestRequest request,
                                                      String userEmail) {
        Account user = findUserByEmail(userEmail);
        Trip trip = tripRepository.findTripByIdAndAccountId(tripId, user.getId())
                .orElseThrow(() -> new NotFoundException("Trip not found!"));

        if (trip.getStatus() == TripStatus.ACCEPTED) {
            throw new BadRequestException("Accepted trip cannot be published again.");
        }

        var existingTravelRequest = travelRequestRepository.findByTripId(tripId);
        if (existingTravelRequest.isPresent()
                && existingTravelRequest.get().getStatus() == TravelRequestStatus.ACCEPTED) {
            throw new BadRequestException("Accepted travel request cannot be published again.");
        }

        TravelRequest travelRequest = existingTravelRequest.orElseGet(TravelRequest::new);

        travelRequest.setTrip(trip);
        travelRequest.setAccount(user);
        travelRequest.setSharedPreferences(request.getSharedPreferences().trim());
        travelRequest.setBudgetMin(request.getBudgetMin());
        travelRequest.setBudgetMax(request.getBudgetMax());
        travelRequest.setDestinationSummary(request.getDestinationSummary().trim());
        travelRequest.setStartDate(request.getStartDate());
        travelRequest.setEndDate(request.getEndDate());
        travelRequest.setIsFlexibleDate(request.getIsFlexibleDate());
        travelRequest.setStatus(TravelRequestStatus.PUBLISHED);
        travelRequest.setPublishedAt(LocalDateTime.now());

        trip.setStatus(TripStatus.PUBLISHED);

        travelRequestRepository.save(travelRequest);

        return new TravelRequestResponse(
                travelRequest.getId(),
                trip.getId(),
                travelRequest.getStatus(),
                travelRequest.getPublishedAt(),
                "Travel request published successfully!"
        );
    }

    public TravelRequestResponse unpublishTravelRequest(Long requestId, String userEmail) {
        Account user = findUserByEmail(userEmail);
        TravelRequest travelRequest = travelRequestRepository.findByIdAndAccountId(requestId, user.getId())
                .orElseThrow(() -> new NotFoundException("Travel request not found!"));

        if (travelRequest.getStatus() == TravelRequestStatus.ACCEPTED) {
            throw new BadRequestException("Accepted travel request cannot be unpublished.");
        }

        if (travelRequest.getStatus() == TravelRequestStatus.CLOSED) {
            return new TravelRequestResponse(
                    travelRequest.getId(),
                    travelRequest.getTrip().getId(),
                    travelRequest.getStatus(),
                    travelRequest.getPublishedAt(),
                    "Travel request already closed."
            );
        }

        travelRequest.setStatus(TravelRequestStatus.CLOSED);
        travelRequest.getTrip().setStatus(TripStatus.DRAFT);

        expireOpenOffersForRequest(travelRequest.getId());

        return new TravelRequestResponse(
                travelRequest.getId(),
                travelRequest.getTrip().getId(),
                travelRequest.getStatus(),
                travelRequest.getPublishedAt(),
                "Travel request closed successfully!"
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<TravelRequestListItemResponse> getPublishedRequestsForAgency(String agencyEmail,
                                                                                      TravelRequestFilterRequest filters,
                                                                                      Pageable pageable) {
        findAgencyByEmail(agencyEmail);

        String destination = filters != null ? normalizeBlankToNull(filters.getDestination()) : null;
        var minBudget = filters != null ? filters.getMinBudget() : null;
        var maxBudget = filters != null ? filters.getMaxBudget() : null;
        var startFrom = filters != null ? filters.getStartFrom() : null;
        var endTo = filters != null ? filters.getEndTo() : null;
        var flexibleDate = filters != null ? filters.getFlexibleDate() : null;

        var page = destination == null
                ? travelRequestRepository.findByStatusWithFilters(
                TravelRequestStatus.PUBLISHED,
                minBudget,
                maxBudget,
                startFrom,
                endTo,
                flexibleDate,
                pageable
        )
                : travelRequestRepository.searchByStatusAndDestinationWithFilters(
                TravelRequestStatus.PUBLISHED,
                destination,
                minBudget,
                maxBudget,
                startFrom,
                endTo,
                flexibleDate,
                pageable
        );

        return PageResponse.from(page.map(this::toTravelRequestListItemResponse));
    }

    @Transactional(readOnly = true)
    public TravelRequestDetailResponse getPublishedRequestDetailsForAgency(Long requestId, String agencyEmail) {
        findAgencyByEmail(agencyEmail);

        TravelRequest travelRequest = travelRequestRepository.findByIdAndStatus(requestId, TravelRequestStatus.PUBLISHED)
                .orElseThrow(() -> new NotFoundException("Travel request not found!"));

        return toTravelRequestDetailResponse(travelRequest);
    }

    @Transactional(readOnly = true)
    public PageResponse<TravelRequestListItemResponse> getMyRequests(String userEmail, Pageable pageable) {
        Account user = findUserByEmail(userEmail);

        var page = travelRequestRepository.findByAccountIdAndStatusNotOrderByPublishedAtDesc(
                user.getId(),
                TravelRequestStatus.ACCEPTED,
                pageable
        );
        return PageResponse.from(page.map(this::toTravelRequestListItemResponse));
    }

    @Transactional(readOnly = true)
    public TravelRequestDetailResponse getMyRequestDetails(Long requestId, String userEmail) {
        Account user = findUserByEmail(userEmail);

        TravelRequest travelRequest = travelRequestRepository.findByIdAndAccountIdAndStatusNot(
                        requestId,
                        user.getId(),
                        TravelRequestStatus.ACCEPTED
                )
                .orElseThrow(() -> new NotFoundException("Travel request not found!"));

        return toTravelRequestDetailResponse(travelRequest);
    }

    private Account findUserByEmail(String email) {
        Account user = accountRepository.findByEmailWithRole(email)
                .orElseThrow(() -> new NotFoundException("Account not found!"));

        if (user.getRole() == null || !"USER".equalsIgnoreCase(user.getRole().getName())) {
            throw new ForbiddenException("Only users can perform this action");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ForbiddenException("User account is inactive.");
        }

        if (!Boolean.TRUE.equals(user.getIsApproved())) {
            throw new ForbiddenException("User account is not approved.");
        }

        return user;
    }

    private Account findAgencyByEmail(String email) {
        Account agency = accountRepository.findByEmailWithRole(email)
                .orElseThrow(() -> new NotFoundException("Account not found!"));

        if (agency.getRole() == null || !"AGENCY".equalsIgnoreCase(agency.getRole().getName())) {
            throw new ForbiddenException("Only agencies can perform this action");
        }

        if (!Boolean.TRUE.equals(agency.getIsActive())) {
            throw new ForbiddenException("Agency account is inactive.");
        }

        if (!Boolean.TRUE.equals(agency.getIsApproved())) {
            throw new ForbiddenException("Agency account is not approved.");
        }

        return agency;
    }

    private String normalizeBlankToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void expireOpenOffersForRequest(Long requestId) {
        var offers = offerRepository.findByRequestId(requestId);
        if (offers.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        boolean changed = false;
        for (Offer offer : offers) {
            if (offer.getStatus() == OfferStatus.DRAFT
                    || offer.getStatus() == OfferStatus.READY
                    || offer.getStatus() == OfferStatus.SENT) {
                offer.setStatus(OfferStatus.EXPIRED);
                offer.setRespondedAt(now);
                changed = true;
            }
        }

        if (changed) {
            offerRepository.saveAll(offers);
        }
    }

    private TravelRequestListItemResponse toTravelRequestListItemResponse(TravelRequest request) {
        return new TravelRequestListItemResponse(
                request.getId(),
                request.getTrip().getId(),
                request.getDestinationSummary(),
                request.getBudgetMin(),
                request.getBudgetMax(),
                request.getStartDate(),
                request.getEndDate(),
                request.getIsFlexibleDate(),
                request.getStatus(),
                request.getPublishedAt()
        );
    }

    private TravelRequestDetailResponse toTravelRequestDetailResponse(TravelRequest request) {
        return new TravelRequestDetailResponse(
                request.getId(),
                request.getTrip().getId(),
                request.getAccount().getId(),
                request.getSharedPreferences(),
                request.getBudgetMin(),
                request.getBudgetMax(),
                request.getDestinationSummary(),
                request.getStartDate(),
                request.getEndDate(),
                request.getIsFlexibleDate(),
                request.getStatus(),
                request.getPublishedAt(),
                request.getCreatedAt(),
                request.getUpdatedAt()
        );
    }
}
