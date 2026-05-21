package ro.stefanscd.tripmatch.trip.service;

import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.common.exception.BadRequestException;
import ro.stefanscd.tripmatch.common.exception.ConflictException;
import ro.stefanscd.tripmatch.common.exception.ForbiddenException;
import ro.stefanscd.tripmatch.common.exception.NotFoundException;
import ro.stefanscd.tripmatch.offer.entity.OfferStatus;
import ro.stefanscd.tripmatch.offer.repository.OfferRepository;
import ro.stefanscd.tripmatch.request.entity.TravelRequest;
import ro.stefanscd.tripmatch.request.entity.TravelRequestStatus;
import ro.stefanscd.tripmatch.request.repository.TravelRequestRepository;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;
import ro.stefanscd.tripmatch.trip.dto.activity.ActivityDetailResponse;
import ro.stefanscd.tripmatch.trip.dto.activity.ActivityListResponse;
import ro.stefanscd.tripmatch.trip.dto.activity.ActivityResponse;
import ro.stefanscd.tripmatch.trip.dto.activity.CreateActivityRequest;
import ro.stefanscd.tripmatch.trip.dto.activity.DuplicateActivityRequest;
import ro.stefanscd.tripmatch.trip.dto.activity.ReorderActivitiesRequest;
import ro.stefanscd.tripmatch.trip.dto.activity.UpdateActivityRequest;
import ro.stefanscd.tripmatch.trip.entity.Activity;
import ro.stefanscd.tripmatch.trip.entity.BudgetCategory;
import ro.stefanscd.tripmatch.trip.entity.Destination;
import ro.stefanscd.tripmatch.trip.entity.Trip;
import ro.stefanscd.tripmatch.trip.repository.ActivityRepository;
import ro.stefanscd.tripmatch.trip.repository.DestinationRepository;
import ro.stefanscd.tripmatch.trip.repository.TripRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ActivityService {
    private final AccountRepository accountRepository;
    private final DestinationRepository destinationRepository;
    private final ActivityRepository activityRepository;
    private final TripRepository tripRepository;
    private final TravelRequestRepository travelRequestRepository;
    private final OfferRepository offerRepository;

    public ActivityService(AccountRepository accountRepository,
                           DestinationRepository destinationRepository,
                           ActivityRepository activityRepository,
                           TripRepository tripRepository,
                           TravelRequestRepository travelRequestRepository,
                           OfferRepository offerRepository) {
        this.accountRepository = accountRepository;
        this.destinationRepository = destinationRepository;
        this.activityRepository = activityRepository;
        this.tripRepository = tripRepository;
        this.travelRequestRepository = travelRequestRepository;
        this.offerRepository = offerRepository;
    }

    @Transactional
    public ActivityResponse createActivity(Long tripId,
                                           Long destinationId,
                                           CreateActivityRequest request,
                                           String email) {
        Destination destination = findDestinationOwnedByUser(tripId, destinationId, email);

        if (!Boolean.TRUE.equals(request.getAllowOverlap())) {
            validateNoOverlap(destination.getId(), request.getActivityDate(), request.getStartTime(), request.getDurationMinutes(), null);
        }

        Activity activity = getActivity(request, destination, destination.getTrip());
        activity.setDisplayOrder(nextDisplayOrder(destination.getId(), request.getActivityDate()));
        activityRepository.save(activity);

        return new ActivityResponse(activity.getId(), "Activity created successfully!");
    }

    @Transactional(readOnly = true)
    public PageResponse<ActivityListResponse> getActivities(String email, Long tripId, Long destinationId, Pageable pageable) {
        Destination destination = findReadableDestination(tripId, destinationId, email);

        Page<Activity> activities = activityRepository.findByDestinationId(destination.getId(), pageable);
        return PageResponse.from(activities.map(this::toActivityListResponse));
    }

    @Transactional(readOnly = true)
    public ActivityDetailResponse getActivity(Long tripId, Long destinationId, Long activityId, String email) {
        Activity activity = findReadableActivity(tripId, destinationId, activityId, email);
        return toActivityDetailResponse(activity);
    }

    @Transactional
    public ActivityResponse updateActivity(Long tripId,
                                           Long destinationId,
                                           Long activityId,
                                           UpdateActivityRequest request,
                                           String email) {
        Activity activity = findActivityOwnedByUser(tripId, destinationId, activityId, email);
        LocalDate previousDate = activity.getActivityDate();

        LocalDate effectiveDate = request.getActivityDate() != null ? request.getActivityDate() : activity.getActivityDate();
        LocalTime effectiveStart = request.getStartTime() != null ? request.getStartTime() : activity.getStartTime();
        Integer effectiveDuration = request.getDurationMinutes() != null ? request.getDurationMinutes() : activity.getDurationMinutes();

        if (!Boolean.TRUE.equals(request.getAllowOverlap())) {
            validateNoOverlap(activity.getDestination().getId(), effectiveDate, effectiveStart, effectiveDuration, activityId);
        }

        if (request.getTitle() != null) {
            activity.setTitle(request.getTitle());
        }
        if (request.getLocation() != null) {
            activity.setLocation(request.getLocation());
        }
        if (request.getActivityDate() != null) {
            activity.setActivityDate(request.getActivityDate());
        }
        if (request.getStartTime() != null) {
            activity.setStartTime(request.getStartTime());
        }
        if (request.getDurationMinutes() != null) {
            activity.setDurationMinutes(request.getDurationMinutes());
        }
        if (request.getEstimatedCost() != null) {
            activity.setEstimatedCost(request.getEstimatedCost());
        }
        if (request.getNotes() != null) {
            activity.setNotes(request.getNotes());
        }
        if (request.getCategory() != null) {
            activity.setCategory(request.getCategory());
        }

        if (request.getActivityDate() != null && !request.getActivityDate().equals(previousDate)) {
            activity.setDisplayOrder(nextDisplayOrder(activity.getDestination().getId(), request.getActivityDate()));
        }

        return new ActivityResponse(activity.getId(), "Activity updated successfully!");
    }

    @Transactional
    public ActivityResponse reorderActivities(Long tripId,
                                              Long destinationId,
                                              ReorderActivitiesRequest request,
                                              String email) {
        Destination destination = findDestinationOwnedByUser(tripId, destinationId, email);
        List<Activity> activities = activityRepository.findByDestinationId(destination.getId());

        if (activities.isEmpty()) {
            throw new BadRequestException("No activities found for destination");
        }

        List<Long> orderedIds = request.getOrderedActivityIds();
        ensureUniqueIds(orderedIds);

        if (orderedIds.size() != activities.size()) {
            throw new BadRequestException("orderedActivityIds must contain all destination activities");
        }

        Map<Long, Activity> activityById = activities.stream()
                .collect(Collectors.toMap(Activity::getId, Function.identity()));

        for (Long activityId : orderedIds) {
            if (!activityById.containsKey(activityId)) {
                throw new BadRequestException("Activity does not belong to destination: " + activityId);
            }
        }

        Map<Long, Integer> rankById = new java.util.HashMap<>();
        for (int i = 0; i < orderedIds.size(); i++) {
            rankById.put(orderedIds.get(i), i);
        }

        Map<LocalDate, List<Activity>> activitiesByDate = activities.stream()
                .collect(Collectors.groupingBy(Activity::getActivityDate));

        for (Map.Entry<LocalDate, List<Activity>> entry : activitiesByDate.entrySet()) {
            List<Activity> sameDay = entry.getValue();
            sameDay.sort((a1, a2) -> Integer.compare(rankById.get(a1.getId()), rankById.get(a2.getId())));

            int order = 0;
            for (Activity activity : sameDay) {
                activity.setDisplayOrder(order++);
            }
        }

        activityRepository.saveAll(activities);
        return new ActivityResponse(null, "Activities reordered successfully!");
    }

    @Transactional
    public ActivityResponse duplicateActivity(Long tripId,
                                              Long destinationId,
                                              Long activityId,
                                              DuplicateActivityRequest request,
                                              String email) {
        Activity source = findActivityOwnedByUser(tripId, destinationId, activityId, email);

        LocalDate targetDate = request != null && request.getActivityDate() != null
                ? request.getActivityDate()
                : source.getActivityDate();

        LocalTime targetStartTime = request != null && request.getStartTime() != null
                ? request.getStartTime()
                : source.getStartTime();

        boolean allowOverlap = request != null && Boolean.TRUE.equals(request.getAllowOverlap());
        if (!allowOverlap) {
            validateNoOverlap(source.getDestination().getId(), targetDate, targetStartTime, source.getDurationMinutes(), null);
        }

        Activity duplicate = new Activity();
        duplicate.setTrip(source.getTrip());
        duplicate.setDestination(source.getDestination());
        duplicate.setTitle(source.getTitle());
        duplicate.setLocation(source.getLocation());
        duplicate.setActivityDate(targetDate);
        duplicate.setStartTime(targetStartTime);
        duplicate.setDurationMinutes(source.getDurationMinutes());
        duplicate.setEstimatedCost(source.getEstimatedCost());
        duplicate.setNotes(source.getNotes());
        duplicate.setCategory(source.getCategory());
        duplicate.setDisplayOrder(nextDisplayOrder(source.getDestination().getId(), targetDate));

        activityRepository.save(duplicate);
        return new ActivityResponse(duplicate.getId(), "Activity duplicated successfully!");
    }

    @Transactional
    public void deleteActivity(Long activityId, Long tripId, Long destinationId, String email) {
        Activity activity = findActivityOwnedByUser(tripId, destinationId, activityId, email);
        activityRepository.delete(activity);
    }

    private static @NonNull Activity getActivity(CreateActivityRequest request, Destination destination, Trip trip) {
        Activity activity = new Activity();
        activity.setDestination(destination);
        activity.setTrip(trip);
        activity.setTitle(request.getTitle());
        activity.setLocation(request.getLocation());
        activity.setNotes(request.getNotes());
        activity.setStartTime(request.getStartTime());
        activity.setDurationMinutes(request.getDurationMinutes());
        activity.setEstimatedCost(request.getEstimatedCost());
        activity.setActivityDate(request.getActivityDate());
        activity.setCategory(request.getCategory() != null ? request.getCategory() : BudgetCategory.ACTIVITIES);
        activity.setDisplayOrder(0);
        return activity;
    }

    private int nextDisplayOrder(Long destinationId, LocalDate activityDate) {
        Integer maxDisplayOrder = activityRepository
                .findMaxDisplayOrderByDestinationIdAndActivityDate(destinationId, activityDate);

        if (maxDisplayOrder == null || maxDisplayOrder < 0) {
            return 0;
        }
        return maxDisplayOrder + 1;
    }

    private void validateNoOverlap(Long destinationId,
                                   LocalDate activityDate,
                                   LocalTime startTime,
                                   int durationMinutes,
                                   Long excludedActivityId) {
        LocalTime candidateEnd = calculateEndTime(startTime, durationMinutes);

        List<Activity> existingActivities = excludedActivityId == null
                ? activityRepository.findByDestinationIdAndActivityDate(destinationId, activityDate)
                : activityRepository.findByDestinationIdAndActivityDateAndIdNot(destinationId, activityDate, excludedActivityId);

        List<Long> conflicts = new ArrayList<>();
        for (Activity existing : existingActivities) {
            LocalTime existingEnd = calculateEndTime(existing.getStartTime(), existing.getDurationMinutes());

            boolean overlaps = startTime.isBefore(existingEnd) && existing.getStartTime().isBefore(candidateEnd);
            if (overlaps) {
                conflicts.add(existing.getId());
            }
        }

        if (!conflicts.isEmpty()) {
            throw new ConflictException(
                    "Activity overlaps with existing activities: " + conflicts + ". Retry with allowOverlap=true if intentional."
            );
        }
    }

    private LocalTime calculateEndTime(LocalTime startTime, int durationMinutes) {
        LocalTime endTime = startTime.plusMinutes(durationMinutes);
        if (endTime.isBefore(startTime)) {
            throw new BadRequestException("Activity duration cannot pass midnight");
        }
        return endTime;
    }

    private Activity findActivityOwnedByUser(Long tripId, Long destinationId, Long activityId, String email) {
        Destination destination = findDestinationOwnedByUser(tripId, destinationId, email);

        return activityRepository.findByIdAndDestinationId(activityId, destination.getId())
                .orElseThrow(() -> new NotFoundException("Activity not found!"));
    }

    private Destination findDestinationOwnedByUser(Long tripId, Long destinationId, String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found!"));

        Trip trip = tripRepository.findTripByIdAndAccountId(tripId, account.getId())
                .orElseThrow(() -> new NotFoundException("Trip not found or not detained by the current user!"));

        return destinationRepository.findByIdAndTripId(destinationId, trip.getId())
                .orElseThrow(() -> new NotFoundException("Destination not found!"));
    }

    private Activity findReadableActivity(Long tripId, Long destinationId, Long activityId, String email) {
        Destination destination = findReadableDestination(tripId, destinationId, email);
        return activityRepository.findByIdAndDestinationId(activityId, destination.getId())
                .orElseThrow(() -> new NotFoundException("Activity not found!"));
    }

    private Destination findReadableDestination(Long tripId, Long destinationId, String email) {
        Trip trip = findReadableTrip(tripId, email);
        return destinationRepository.findByIdAndTripId(destinationId, trip.getId())
                .orElseThrow(() -> new NotFoundException("Destination not found!"));
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

    private void ensureAgencyIsActiveAndApproved(Account agency) {
        if (!Boolean.TRUE.equals(agency.getIsActive())) {
            throw new ForbiddenException("Agency account is inactive.");
        }
        if (!Boolean.TRUE.equals(agency.getIsApproved())) {
            throw new ForbiddenException("Agency account is not approved.");
        }
    }

    private void ensureUniqueIds(List<Long> ids) {
        Set<Long> unique = new HashSet<>(ids);
        if (unique.size() != ids.size()) {
            throw new BadRequestException("orderedActivityIds must not contain duplicates");
        }
    }

    private ActivityListResponse toActivityListResponse(Activity activity) {
        return new ActivityListResponse(
                activity.getId(),
                activity.getTitle(),
                activity.getLocation(),
                activity.getActivityDate(),
                activity.getStartTime(),
                activity.getDurationMinutes(),
                activity.getDisplayOrder(),
                activity.getCategory(),
                activity.getEstimatedCost(),
                activity.getNotes()
        );
    }

    private ActivityDetailResponse toActivityDetailResponse(Activity activity) {
        return new ActivityDetailResponse(
                activity.getId(),
                activity.getTitle(),
                activity.getLocation(),
                activity.getActivityDate(),
                activity.getStartTime(),
                activity.getDurationMinutes(),
                activity.getDisplayOrder(),
                activity.getCategory(),
                activity.getEstimatedCost(),
                activity.getNotes(),
                activity.getCreatedAt(),
                activity.getUpdatedAt()
        );
    }
}
