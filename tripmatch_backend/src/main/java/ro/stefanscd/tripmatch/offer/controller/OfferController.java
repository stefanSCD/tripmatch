package ro.stefanscd.tripmatch.offer.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ro.stefanscd.tripmatch.offer.dto.CreateOfferRequest;
import ro.stefanscd.tripmatch.offer.dto.OfferDetailResponse;
import ro.stefanscd.tripmatch.offer.dto.OfferListItemResponse;
import ro.stefanscd.tripmatch.offer.dto.OfferResponse;
import ro.stefanscd.tripmatch.offer.dto.RejectOfferRequest;
import ro.stefanscd.tripmatch.offer.dto.UpdateOfferRequest;
import ro.stefanscd.tripmatch.offer.service.OfferService;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;

@RestController
@Validated
@RequestMapping("/api")
public class OfferController {
    private final OfferService offerService;

    public OfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @PostMapping("/requests/{requestId}/offers")
    public ResponseEntity<OfferResponse> createOffer(
            @PathVariable @Positive Long requestId,
            @RequestBody @Valid CreateOfferRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(offerService.createOffer(requestId, request, authentication.getName()));
    }

    @GetMapping("/offers/{offerId}")
    public ResponseEntity<OfferDetailResponse> getOfferDetails(
            @PathVariable @Positive Long offerId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(offerService.getOfferDetails(offerId, authentication.getName()));
    }

    @PatchMapping("/offers/{offerId}")
    public ResponseEntity<OfferResponse> updateOffer(
            @PathVariable @Positive Long offerId,
            @RequestBody @Valid UpdateOfferRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(offerService.updateOffer(offerId, request, authentication.getName()));
    }

    @DeleteMapping("/offers/{offerId}")
    public ResponseEntity<OfferResponse> deleteOffer(
            @PathVariable @Positive Long offerId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(offerService.deleteOffer(offerId, authentication.getName()));
    }

    @PostMapping("/offers/{offerId}/send")
    public ResponseEntity<OfferResponse> sendOffer(
            @PathVariable @Positive Long offerId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(offerService.sendOffer(offerId, authentication.getName()));
    }

    @PostMapping("/offers/{offerId}/accept")
    public ResponseEntity<OfferResponse> acceptOffer(
            @PathVariable @Positive Long offerId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(offerService.acceptOffer(offerId, authentication.getName()));
    }

    @PostMapping("/offers/{offerId}/reject")
    public ResponseEntity<OfferResponse> rejectOffer(
            @PathVariable @Positive Long offerId,
            @RequestBody @Valid RejectOfferRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(offerService.rejectOffer(offerId, request, authentication.getName()));
    }

    @GetMapping("/offers/agency")
    public ResponseEntity<PageResponse<OfferListItemResponse>> getOffersForAgency(
            Authentication authentication,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(offerService.getOffersForAgency(authentication.getName(), pageable));
    }

    @GetMapping("/offers/user")
    public ResponseEntity<PageResponse<OfferListItemResponse>> getOffersForUser(
            Authentication authentication,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(offerService.getOffersForUser(authentication.getName(), pageable));
    }
}
