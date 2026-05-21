package ro.stefanscd.tripmatch.trip.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.common.exception.BadRequestException;
import ro.stefanscd.tripmatch.common.exception.ForbiddenException;
import ro.stefanscd.tripmatch.common.exception.NotFoundException;
import ro.stefanscd.tripmatch.offer.entity.OfferStatus;
import ro.stefanscd.tripmatch.offer.repository.OfferRepository;
import ro.stefanscd.tripmatch.request.entity.TravelRequest;
import ro.stefanscd.tripmatch.request.entity.TravelRequestStatus;
import ro.stefanscd.tripmatch.request.repository.TravelRequestRepository;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;
import ro.stefanscd.tripmatch.trip.dto.destination.CreateDestinationRequest;
import ro.stefanscd.tripmatch.trip.dto.destination.DestinationDetailResponse;
import ro.stefanscd.tripmatch.trip.dto.destination.DestinationResponse;
import ro.stefanscd.tripmatch.trip.dto.destination.DestinationListResponse;
import ro.stefanscd.tripmatch.trip.dto.destination.UpdateDestinationRequest;
import ro.stefanscd.tripmatch.trip.entity.Destination;
import ro.stefanscd.tripmatch.trip.entity.Trip;
import ro.stefanscd.tripmatch.trip.repository.DestinationRepository;
import ro.stefanscd.tripmatch.trip.repository.TripRepository;

import java.time.LocalDate;

@Service
public class DestinationService {
    private final DestinationRepository destinationRepository;
    private final AccountRepository accountRepository;
    private final TripRepository tripRepository;
    private final TravelRequestRepository travelRequestRepository;
    private final OfferRepository offerRepository;

    public DestinationService(DestinationRepository destinationRepository,
                              AccountRepository accountRepository,
                              TripRepository tripRepository,
                              TravelRequestRepository travelRequestRepository,
                              OfferRepository offerRepository) {
        this.destinationRepository = destinationRepository;
        this.accountRepository = accountRepository;
        this.tripRepository = tripRepository;
        this.travelRequestRepository = travelRequestRepository;
        this.offerRepository = offerRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<DestinationListResponse> getDestinations(String email, Long tripId, Pageable pageable) {
        Trip trip = findReadableTrip(tripId, email);

        Page<Destination> destinations = destinationRepository.findByTripId(trip.getId(), pageable);
        return PageResponse.from(destinations.map(this::toDestinationListResponse));
    }

    @Transactional(readOnly = true)
    public DestinationDetailResponse getDestination(Long tripId, Long destinationId, String email) {
        Trip trip = findReadableTrip(tripId, email);

        Destination destination = destinationRepository.findByIdAndTripId(destinationId, trip.getId())
                .orElseThrow(() -> new NotFoundException("Destination not found!"));

        return toDestinationDetailResponse(destination);
    }

    @Transactional
    public DestinationResponse createDestination(CreateDestinationRequest request, String email, Long tripId) {
        Trip trip = findTripOwnedByUser(tripId, email);

        Destination destination = new Destination();
        destination.setTrip(trip);
        destination.setCity(request.getCity());
        destination.setCountry(request.getCountry());
        destination.setStartDate(request.getStartDate());
        destination.setEndDate(request.getEndDate());
        destination.setNotes(request.getNotes());

        destinationRepository.save(destination);
        return new DestinationResponse(destination.getId(), "Destination created successfully!");
    }

    @Transactional
    public DestinationResponse updateDestination(UpdateDestinationRequest request, Long tripId, Long destinationId, String email) {
        Trip trip = findTripOwnedByUser(tripId, email);

        Destination destination = destinationRepository.findByIdAndTripId(destinationId, trip.getId())
                .orElseThrow(() -> new NotFoundException("Destination not found!"));

        LocalDate effectiveStart = request.getStartDate() != null ? request.getStartDate() : destination.getStartDate();
        LocalDate effectiveEnd = request.getEndDate() != null ? request.getEndDate() : destination.getEndDate();

        if (effectiveStart.isAfter(effectiveEnd)) {
            throw new BadRequestException("endDate cannot be before startDate");
        }

        if (request.getStartDate() != null) {
            destination.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            destination.setEndDate(request.getEndDate());
        }
        if (request.getCity() != null) {
            destination.setCity(request.getCity());
        }
        if (request.getCountry() != null) {
            destination.setCountry(request.getCountry());
        }
        if (request.getNotes() != null) {
            destination.setNotes(request.getNotes());
        }

        return new DestinationResponse(destination.getId(), "Destination updated successfully!");
    }

    @Transactional
    public void deleteDestination(Long tripId, Long destinationId, String email) {
        Trip trip = findTripOwnedByUser(tripId, email);

        Destination destination = destinationRepository.findByIdAndTripId(destinationId, trip.getId())
                .orElseThrow(() -> new NotFoundException("Destination not found!"));

        destinationRepository.delete(destination);
    }

    private DestinationListResponse toDestinationListResponse(Destination destination){
        return new DestinationListResponse(
                destination.getId(),
                destination.getCity(),
                destination.getCountry(),
                destination.getStartDate(),
                destination.getEndDate(),
                destination.getNotes()
        );
    }

    private DestinationDetailResponse toDestinationDetailResponse(Destination destination) {
        return new DestinationDetailResponse(
                destination.getId(),
                destination.getCity(),
                destination.getCountry(),
                destination.getStartDate(),
                destination.getEndDate(),
                destination.getNotes(),
                destination.getCreatedAt(),
                destination.getUpdatedAt()
        );
    }

    private Trip findReadableTrip(Long tripId, String email) {
        Account account = accountRepository.findByEmailWithRole(email)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        String role = account.getRole() != null ? account.getRole().getName() : "";
        if ("USER".equalsIgnoreCase(role)) {
            return tripRepository.findTripByIdAndAccountId(tripId, account.getId())
                    .orElseThrow(() -> new NotFoundException("Trip not found or not detained by the current user!"));
        }

        if ("AGENCY".equalsIgnoreCase(role)) {
            return findReadableTripForAgency(tripId, account);
        }

        throw new ForbiddenException("Role is not allowed to access trip itinerary");
    }

    private Trip findReadableTripForAgency(Long tripId, Account agency) {
        ensureAgencyIsActiveAndApproved(agency);

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new NotFoundException("Trip not found or not accessible for the current account!"));

        TravelRequest request = travelRequestRepository.findByTripId(tripId)
                .orElseThrow(() -> new NotFoundException("Trip not found or not accessible for the current account!"));

        if (request.getStatus() == TravelRequestStatus.PUBLISHED) {
            return trip;
        }

        if (request.getStatus() == TravelRequestStatus.ACCEPTED
                && offerRepository.existsByRequestIdAndAgencyIdAndStatus(
                request.getId(),
                agency.getId(),
                OfferStatus.ACCEPTED
        )) {
            return trip;
        }

        throw new NotFoundException("Trip not found or not accessible for the current account!");
    }

    private Trip findTripOwnedByUser(Long tripId, String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found!"));

        return tripRepository.findTripByIdAndAccountId(tripId, account.getId())
                .orElseThrow(() -> new NotFoundException("Trip not found or not detained by the current user!"));
    }

    private void ensureAgencyIsActiveAndApproved(Account agency) {
        if (!Boolean.TRUE.equals(agency.getIsActive())) {
            throw new ForbiddenException("Agency account is inactive.");
        }
        if (!Boolean.TRUE.equals(agency.getIsApproved())) {
            throw new ForbiddenException("Agency account is not approved.");
        }
    }
}

