package ro.stefanscd.tripmatch.request.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ro.stefanscd.tripmatch.request.dto.PublishTravelRequestRequest;
import ro.stefanscd.tripmatch.request.dto.TravelRequestDetailResponse;
import ro.stefanscd.tripmatch.request.dto.TravelRequestFilterRequest;
import ro.stefanscd.tripmatch.request.dto.TravelRequestListItemResponse;
import ro.stefanscd.tripmatch.request.dto.TravelRequestResponse;
import ro.stefanscd.tripmatch.request.service.TravelRequestService;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;

@RestController
@Validated
@RequestMapping("/api")
public class TravelRequestController {
    private final TravelRequestService travelRequestService;

    public TravelRequestController(TravelRequestService travelRequestService) {
        this.travelRequestService = travelRequestService;
    }

    @PostMapping("/trips/{tripId}/requests/publish")
    public ResponseEntity<TravelRequestResponse> publishTravelRequest(
            @PathVariable @Positive Long tripId,
            @RequestBody @Valid PublishTravelRequestRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(travelRequestService.publishTravelRequest(tripId, request, authentication.getName()));
    }

    @PatchMapping("/requests/{requestId}/unpublish")
    public ResponseEntity<TravelRequestResponse> unpublishTravelRequest(
            @PathVariable @Positive Long requestId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(travelRequestService.unpublishTravelRequest(requestId, authentication.getName()));
    }

    @GetMapping("/requests")
    public ResponseEntity<PageResponse<TravelRequestListItemResponse>> getPublishedRequestsForAgency(
            Authentication authentication,
            @Valid @ModelAttribute TravelRequestFilterRequest filters,
            @PageableDefault(size = 20, sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(
                travelRequestService.getPublishedRequestsForAgency(authentication.getName(), filters, pageable)
        );
    }

    @GetMapping("/requests/{requestId}")
    public ResponseEntity<TravelRequestDetailResponse> getPublishedRequestDetailsForAgency(
            @PathVariable @Positive Long requestId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                travelRequestService.getPublishedRequestDetailsForAgency(requestId, authentication.getName())
        );
    }

    @GetMapping("/my/requests")
    public ResponseEntity<PageResponse<TravelRequestListItemResponse>> getMyRequests(
            Authentication authentication,
            @PageableDefault(size = 20, sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(travelRequestService.getMyRequests(authentication.getName(), pageable));
    }

    @GetMapping("/my/requests/{requestId}")
    public ResponseEntity<TravelRequestDetailResponse> getMyRequestDetails(
            @PathVariable @Positive Long requestId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(travelRequestService.getMyRequestDetails(requestId, authentication.getName()));
    }
}
