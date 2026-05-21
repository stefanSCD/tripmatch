package ro.stefanscd.tripmatch.trip.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.common.exception.BadRequestException;
import ro.stefanscd.tripmatch.common.exception.NotFoundException;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;
import ro.stefanscd.tripmatch.trip.dto.trip.CreateTripRequest;
import ro.stefanscd.tripmatch.trip.dto.trip.TripDetailResponse;
import ro.stefanscd.tripmatch.trip.dto.trip.TripListResponse;
import ro.stefanscd.tripmatch.trip.dto.trip.TripResponse;
import ro.stefanscd.tripmatch.trip.dto.trip.UpdateTripRequest;
import ro.stefanscd.tripmatch.trip.entity.Trip;
import ro.stefanscd.tripmatch.trip.repository.TripRepository;

import java.time.LocalDate;

@Service
public class TripService {
    private final TripRepository tripRepository;
    private final AccountRepository accountRepository;

    public TripService(TripRepository tripRepository, AccountRepository accountRepository) {
        this.tripRepository = tripRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<TripListResponse> getTrips(String email, Pageable pageable) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        Page<Trip> trips = tripRepository.findByAccountId(account.getId(), pageable);
        return PageResponse.from(trips.map(this::toTripListResponse));
    }

    @Transactional(readOnly = true)
    public TripDetailResponse getTrip(Long tripId, String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        Trip trip = tripRepository.findTripByIdAndAccountId(tripId, account.getId())
                .orElseThrow(() -> new NotFoundException("Trip not found!"));

        return toTripDetailResponse(trip);
    }

    @Transactional
    public TripResponse createTrip(CreateTripRequest request, String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        Trip trip = new Trip();
        trip.setAccount(account);
        trip.setTitle(request.getTitle());
        trip.setDescription(request.getDescription());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setCreatedWithAi(request.getCreatedWithAi());

        tripRepository.save(trip);

        return new TripResponse(trip.getId(), "Trip created successfully!");
    }

    @Transactional
    public TripResponse updateTrip(Long tripId, UpdateTripRequest request, String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        Trip trip = tripRepository.findTripByIdAndAccountId(tripId, account.getId())
                .orElseThrow(() -> new NotFoundException("Trip not found!"));

        LocalDate effectiveStart = request.getStartDate() != null ? request.getStartDate() : trip.getStartDate();
        LocalDate effectiveEnd = request.getEndDate() != null ? request.getEndDate() : trip.getEndDate();

        if (effectiveStart.isAfter(effectiveEnd)) {
            throw new BadRequestException("endDate cannot be before startDate");
        }

        if (request.getDescription() != null) {
            trip.setDescription(request.getDescription());
        }
        if (request.getTitle() != null) {
            trip.setTitle(request.getTitle());
        }
        if (request.getStartDate() != null) {
            trip.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            trip.setEndDate(request.getEndDate());
        }

        return new TripResponse(trip.getId(), "Trip updated successfully!");
    }

    @Transactional
    public void deleteTrip(Long tripId, String email){
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        Trip trip = tripRepository.findTripByIdAndAccountId(tripId, account.getId())
                .orElseThrow(() -> new NotFoundException("Trip not found!"));

        tripRepository.delete(trip);
    }

    private TripListResponse toTripListResponse(Trip trip){
        return new TripListResponse(
                trip.getId(),
                trip.getTitle(),
                trip.getDescription(),
                trip.getStartDate(),
                trip.getEndDate(),
                trip.getStatus()
        );
    }

    private TripDetailResponse toTripDetailResponse(Trip trip) {
        return new TripDetailResponse(
                trip.getId(),
                trip.getTitle(),
                trip.getDescription(),
                trip.getStartDate(),
                trip.getEndDate(),
                trip.getCreatedWithAi(),
                trip.getStatus(),
                trip.getCreatedAt(),
                trip.getUpdatedAt()
        );
    }
}
