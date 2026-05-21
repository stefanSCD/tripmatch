package ro.stefanscd.tripmatch.trip.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;
import ro.stefanscd.tripmatch.trip.dto.activity.*;
import ro.stefanscd.tripmatch.trip.dto.ai.*;
import ro.stefanscd.tripmatch.trip.dto.budget.TripBudgetResponse;
import ro.stefanscd.tripmatch.trip.dto.budget.UpsertTripBudgetRequest;
import ro.stefanscd.tripmatch.trip.dto.destination.*;
import ro.stefanscd.tripmatch.trip.dto.trip.*;
import ro.stefanscd.tripmatch.trip.service.ActivityService;
import ro.stefanscd.tripmatch.trip.service.AiDraftService;
import ro.stefanscd.tripmatch.trip.service.DestinationService;
import ro.stefanscd.tripmatch.trip.service.TripBudgetService;
import ro.stefanscd.tripmatch.trip.service.TripService;

@RestController
@Validated
@RequestMapping("/api/trips")
public class TripController {
    private final TripService tripService;
    private final DestinationService destinationService;
    private final ActivityService activityService;
    private final TripBudgetService tripBudgetService;
    private final AiDraftService aiDraftService;

    public TripController(TripService tripService,
                          DestinationService destinationService,
                          ActivityService activityService,
                          TripBudgetService tripBudgetService,
                          AiDraftService aiDraftService) {
        this.tripService = tripService;
        this.destinationService = destinationService;
        this.activityService = activityService;
        this.tripBudgetService = tripBudgetService;
        this.aiDraftService = aiDraftService;
    }

    @PutMapping("/{tripId}/budget")
    public ResponseEntity<TripBudgetResponse> upsertTripBudget(
            @PathVariable @Positive Long tripId,
            @Valid @RequestBody UpsertTripBudgetRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                tripBudgetService.upsertTripBudget(tripId, request, authentication.getName())
        );
    }

    @GetMapping("/{tripId}/budget")
    public ResponseEntity<TripBudgetResponse> getTripBudgetByTrip(
            @PathVariable @Positive Long tripId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(tripBudgetService.getTripBudgetByTrip(tripId, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<PageResponse<TripListResponse>> getTrips(
            Authentication authentication,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(tripService.getTrips(authentication.getName(), pageable));
    }

    @GetMapping("/{tripId}")
    public ResponseEntity<TripDetailResponse> getTrip(
            @PathVariable Long tripId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(tripService.getTrip(tripId, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<TripResponse> createTrip(

            @Valid @RequestBody CreateTripRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(tripService.createTrip(request, authentication.getName()));
    }

    @PatchMapping("/{tripId}")
    public ResponseEntity<TripResponse> updateTrip(
            @PathVariable Long tripId,
            @Valid @RequestBody UpdateTripRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(tripService.updateTrip(tripId, request, authentication.getName()));
    }

    @DeleteMapping("/{tripId}")
    public ResponseEntity<Void> deleteTrip(
            @PathVariable Long tripId,
            Authentication authentication
    ) {
        tripService.deleteTrip(tripId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{tripId}/destinations")
    public ResponseEntity<PageResponse<DestinationListResponse>> getDestinations(
            Authentication authentication,
            @PathVariable Long tripId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(destinationService.getDestinations(authentication.getName(), tripId, pageable));
    }

    @GetMapping("/{tripId}/destinations/{destinationId}")
    public ResponseEntity<DestinationDetailResponse> getDestination(
            @PathVariable Long tripId,
            @PathVariable Long destinationId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(destinationService.getDestination(tripId, destinationId, authentication.getName()));
    }

    @PostMapping("/{tripId}/destinations")
    public ResponseEntity<DestinationResponse> createDestination(
            @PathVariable Long tripId,
            @Valid @RequestBody CreateDestinationRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(destinationService.createDestination(request, authentication.getName(), tripId));
    }

    @PatchMapping("/{tripId}/destinations/{destinationId}")
    public ResponseEntity<DestinationResponse> updateDestination(
            @PathVariable Long tripId,
            @PathVariable Long destinationId,
            @Valid @RequestBody UpdateDestinationRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(destinationService.updateDestination(request, tripId, destinationId, authentication.getName()));
    }

    @DeleteMapping("/{tripId}/destinations/{destinationId}")
    public ResponseEntity<Void> deleteDestination(
            @PathVariable Long tripId,
            @PathVariable Long destinationId,
            Authentication authentication
    ) {
        destinationService.deleteDestination(tripId, destinationId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{tripId}/destinations/{destinationId}/activities")
    public ResponseEntity<PageResponse<ActivityListResponse>> getActivities(
            @PathVariable Long tripId,
            @PathVariable Long destinationId,
            Authentication authentication,
            @PageableDefault(size = 10, sort = {"activityDate", "displayOrder"}, direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(activityService.getActivities(authentication.getName(), tripId, destinationId, pageable));
    }

    @GetMapping("/{tripId}/destinations/{destinationId}/activities/{activityId}")
    public ResponseEntity<ActivityDetailResponse> getActivity(
            @PathVariable Long tripId,
            @PathVariable Long destinationId,
            @PathVariable Long activityId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(activityService.getActivity(tripId, destinationId, activityId, authentication.getName()));
    }

    @PostMapping("/{tripId}/destinations/{destinationId}/activities")
    public ResponseEntity<ActivityResponse> createActivity(
            @PathVariable Long tripId,
            @PathVariable Long destinationId,
            @Valid @RequestBody CreateActivityRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(activityService.createActivity(tripId, destinationId, request, authentication.getName()));
    }

    @PutMapping("/{tripId}/destinations/{destinationId}/activities/reorder")
    public ResponseEntity<ActivityResponse> reorderActivities(
            @PathVariable Long tripId,
            @PathVariable Long destinationId,
            @Valid @RequestBody ReorderActivitiesRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(activityService.reorderActivities(tripId, destinationId, request, authentication.getName()));
    }

    @PatchMapping("/{tripId}/destinations/{destinationId}/activities/{activityId}")
    public ResponseEntity<ActivityResponse> updateActivity(
            @PathVariable Long tripId,
            @PathVariable Long destinationId,
            @PathVariable Long activityId,
            @Valid @RequestBody UpdateActivityRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(activityService.updateActivity(tripId, destinationId, activityId, request, authentication.getName()));
    }

    @DeleteMapping("/{tripId}/destinations/{destinationId}/activities/{activityId}")
    public ResponseEntity<Void> deleteActivity(
            @PathVariable Long tripId,
            @PathVariable Long destinationId,
            @PathVariable Long activityId,
            Authentication authentication
    ) {
        activityService.deleteActivity(activityId, tripId, destinationId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{tripId}/destinations/{destinationId}/activities/{activityId}/duplicate")
    public ResponseEntity<ActivityResponse> duplicateActivity(
            @PathVariable Long tripId,
            @PathVariable Long destinationId,
            @PathVariable Long activityId,
            @RequestBody(required = false) @Valid DuplicateActivityRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(activityService.duplicateActivity(
                tripId,
                destinationId,
                activityId,
                request,
                authentication.getName()
        ));
    }

    @PostMapping("/ai/generate")
    public ResponseEntity<AiDraftDetailResponse> generateTrip(
            @RequestBody @Valid GenerateAiDraftRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(aiDraftService.generateTrip(request, authentication.getName()));
    }

    @GetMapping("/ai/drafts/{id}")
    public ResponseEntity<AiDraftDetailResponse> getDraftById(
            @PathVariable @Positive Long id,
            Authentication authentication) {
        return ResponseEntity.ok(aiDraftService.getDraftById(id, authentication.getName()));
    }

    @GetMapping("/ai/drafts")
    public ResponseEntity<PageResponse<AiDraftListItemResponse>> getDrafts(
            Authentication authentication,
            @PageableDefault(size = 10, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(aiDraftService.getDrafts(authentication.getName(), pageable));
    }

    @PatchMapping("/ai/drafts/{id}")
    public ResponseEntity<AiDraftDetailResponse> updateDraft(
            @PathVariable @Positive Long id,
            @RequestBody @Valid UpdateAiDraftRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(aiDraftService.updateDraft(id, request, authentication.getName()));
    }

    @PostMapping("/ai/drafts/{id}/save-as-trip")
    public ResponseEntity<TripResponse> saveAsTrip(
            @PathVariable @Positive Long id,
            @RequestBody(required = false) @Valid SaveDraftAsTripRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(aiDraftService.saveAsTrip(id, request, authentication.getName()));
    }

    @PostMapping("/ai/drafts/{id}/regenerate-day")
    public ResponseEntity<AiDraftDetailResponse> regenerateDraft(
            @PathVariable @Positive Long id,
            @RequestBody @Valid RegenerateDraftDayRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(aiDraftService.regenerateDraft(id, request, authentication.getName()));
    }
}
