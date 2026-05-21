package ro.stefanscd.tripmatch.offer.service;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.common.exception.BadRequestException;
import ro.stefanscd.tripmatch.common.exception.ConflictException;
import ro.stefanscd.tripmatch.common.exception.ForbiddenException;
import ro.stefanscd.tripmatch.common.exception.NotFoundException;
import ro.stefanscd.tripmatch.notification.entity.NotificationType;
import ro.stefanscd.tripmatch.notification.service.NotificationService;
import ro.stefanscd.tripmatch.offer.dto.*;
import ro.stefanscd.tripmatch.offer.entity.Offer;
import ro.stefanscd.tripmatch.offer.entity.OfferStatus;
import ro.stefanscd.tripmatch.offer.repository.OfferRepository;
import ro.stefanscd.tripmatch.request.entity.TravelRequest;
import ro.stefanscd.tripmatch.request.entity.TravelRequestStatus;
import ro.stefanscd.tripmatch.request.repository.TravelRequestRepository;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;
import ro.stefanscd.tripmatch.trip.entity.TripStatus;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class OfferService {
    private final OfferRepository offerRepository;
    private final TravelRequestRepository travelRequestRepository;
    private final AccountRepository accountRepository;
    private final NotificationService notificationService;

    public OfferService(OfferRepository offerRepository,
                        TravelRequestRepository travelRequestRepository,
                        AccountRepository accountRepository,
                        NotificationService notificationService) {
        this.offerRepository = offerRepository;
        this.travelRequestRepository = travelRequestRepository;
        this.accountRepository = accountRepository;
        this.notificationService = notificationService;
    }

    public OfferResponse createOffer(Long requestId, CreateOfferRequest request, String agencyEmail) {
        Account agency = findAgencyByEmail(agencyEmail);
        TravelRequest travelRequest = findRequestForOfferCreation(requestId, agency);

        Offer offer = new Offer();
        offer.setRequest(travelRequest);
        offer.setAgency(agency);
        offer.setPrice(request.getPrice());
        offer.setCurrency(request.getCurrency().trim().toUpperCase());
        offer.setAccommodationDetails(request.getAccommodationDetails());
        offer.setTransportDetails(request.getTransportDetails());
        offer.setItinerarySummary(request.getItinerarySummary());
        offer.setConditions(request.getConditions());
        offer.setAttachmentUrl(request.getAttachmentUrl());
        offer.setStatus(OfferStatus.DRAFT);
        offer.setSentAt(null);

        offerRepository.save(offer);

        return new OfferResponse(offer.getId(), offer.getStatus(), "Offer created successfully!");
    }

    public OfferResponse updateOffer(Long offerId, UpdateOfferRequest request, String agencyEmail) {
        Account agency = findAgencyByEmail(agencyEmail);
        Offer offer = findAgencyOwnedOffer(offerId, agency.getId());

        if (!isDraftOrReady(offer.getStatus())) {
            throw new BadRequestException("Only DRAFT or READY offers can be updated");
        }

        if (request.getStatus() != null && !isDraftOrReady(request.getStatus())) {
            throw new BadRequestException("Offer status can only be set to DRAFT or READY in update");
        }

        if (request.getPrice() != null) offer.setPrice(request.getPrice());
        if (request.getCurrency() != null) offer.setCurrency(request.getCurrency().trim().toUpperCase());
        if (request.getAccommodationDetails() != null) offer.setAccommodationDetails(request.getAccommodationDetails());
        if (request.getTransportDetails() != null) offer.setTransportDetails(request.getTransportDetails());
        if (request.getItinerarySummary() != null) offer.setItinerarySummary(request.getItinerarySummary());
        if (request.getConditions() != null) offer.setConditions(request.getConditions());
        if (request.getAttachmentUrl() != null) offer.setAttachmentUrl(request.getAttachmentUrl());
        if (request.getStatus() != null) offer.setStatus(request.getStatus());

        offerRepository.save(offer);
        return new OfferResponse(offer.getId(), offer.getStatus(), "Offer updated successfully!");
    }

    @Transactional(readOnly = true)
    public OfferDetailResponse getOfferDetails(Long offerId, String currentEmail) {
        Account account = findAccountByEmail(currentEmail);
        Offer offer;

        if ("AGENCY".equalsIgnoreCase(account.getRole().getName())) {
            offer = findAgencyOwnedOffer(offerId, account.getId());
        } else if ("USER".equalsIgnoreCase(account.getRole().getName())) {
            offer = findUserOwnedOffer(offerId, account.getId());
        } else {
            throw new ForbiddenException("Role is not allowed to access offers");
        }
        return toOfferDetailResponse(offer);
    }

    public OfferResponse deleteOffer(Long offerId, String agencyEmail) {
        Account agency = findAgencyByEmail(agencyEmail);
        Offer offer = findAgencyOwnedOffer(offerId, agency.getId());

        if (offer.getStatus() != OfferStatus.DRAFT && offer.getStatus() != OfferStatus.READY) {
            throw new BadRequestException("Only DRAFT or READY offers can be deleted");
        }

        offerRepository.delete(offer);
        return new OfferResponse(offer.getId(), offer.getStatus(), "Offer deleted successfully!");
    }

    public OfferResponse sendOffer(Long offerId, String agencyEmail) {
        Account agency = findAgencyByEmail(agencyEmail);
        Offer offer = findAgencyOwnedOffer(offerId, agency.getId());

        if (offer.getStatus() != OfferStatus.DRAFT && offer.getStatus() != OfferStatus.READY) {
            throw new BadRequestException("Only DRAFT or READY offers can be sent");
        }

        ensureRequestIsOpenForOffers(offer.getRequest());

        if (offerRepository.existsByRequestIdAndStatus(offer.getRequest().getId(), OfferStatus.ACCEPTED)) {
            throw new ConflictException("Cannot send offer because this request already has an accepted offer");
        }

        offer.setStatus(OfferStatus.SENT);
        offer.setSentAt(LocalDateTime.now());
        offer.setRespondedAt(null);

        notificationService.createNotification(
                offer.getRequest().getAccount(),
                NotificationType.OFFER_SENT,
                "New offer received",
                "You have received a new offer for your travel request."
        );

        return new OfferResponse(offer.getId(), offer.getStatus(), "Offer sent successfully!");
    }

    public OfferResponse acceptOffer(Long offerId, String userEmail) {
        Account user = findUserByEmail(userEmail);
        Offer selectedOffer = findUserOwnedOffer(offerId, user.getId());
        Long requestId = selectedOffer.getRequest().getId();

        List<Offer> lockedOffers = offerRepository.findByRequestIdForUpdate(requestId);
        Offer lockedSelectedOffer = lockedOffers.stream()
                .filter(offer -> offer.getId().equals(offerId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Offer not found!"));

        if (lockedSelectedOffer.getStatus() == OfferStatus.ACCEPTED) {
            return new OfferResponse(lockedSelectedOffer.getId(), lockedSelectedOffer.getStatus(), "Offer already accepted.");
        }

        if (lockedSelectedOffer.getStatus() != OfferStatus.SENT) {
            throw new BadRequestException("Only SENT offers can be accepted");
        }

        boolean acceptedAlreadyExists = lockedOffers.stream()
                .anyMatch(offer -> offer.getStatus() == OfferStatus.ACCEPTED);
        if (acceptedAlreadyExists) {
            throw new ConflictException("Another offer has already been accepted for this request");
        }

        LocalDateTime now = LocalDateTime.now();
        List<Offer> rejectedOffers = new java.util.ArrayList<>();
        for (Offer offer : lockedOffers) {
            if (offer.getId().equals(lockedSelectedOffer.getId())) {
                offer.setStatus(OfferStatus.ACCEPTED);
                offer.setRespondedAt(now);
                continue;
            }

            if (offer.getStatus() == OfferStatus.SENT) {
                offer.setStatus(OfferStatus.REJECTED);
                offer.setRespondedAt(now);
                rejectedOffers.add(offer);
            } else if (offer.getStatus() == OfferStatus.DRAFT || offer.getStatus() == OfferStatus.READY) {
                offer.setStatus(OfferStatus.EXPIRED);
                offer.setRespondedAt(now);
            }
        }

        notificationService.createNotification(
                lockedSelectedOffer.getAgency(),
                NotificationType.OFFER_ACCEPTED,
                "Offer accepted",
                "Your offer has been accepted by the traveler."
        );

        for (Offer rejectedOffer : rejectedOffers) {
            notificationService.createNotification(
                    rejectedOffer.getAgency(),
                    NotificationType.OFFER_REJECTED,
                    "Offer rejected",
                    "Your offer was rejected because another offer was accepted."
            );
        }

        lockedSelectedOffer.getRequest().setStatus(TravelRequestStatus.ACCEPTED);
        lockedSelectedOffer.getRequest().getTrip().setStatus(TripStatus.ACCEPTED);

        return new OfferResponse(lockedSelectedOffer.getId(), OfferStatus.ACCEPTED, "Offer accepted successfully!");
    }

    public OfferResponse rejectOffer(Long offerId, RejectOfferRequest request, String userEmail) {
        Account user = findUserByEmail(userEmail);
        Offer offer = findUserOwnedOffer(offerId, user.getId());

        if (offer.getStatus() != OfferStatus.SENT) {
            throw new BadRequestException("Only SENT offers can be rejected");
        }

        offer.setStatus(OfferStatus.REJECTED);
        offer.setFeedbackMessage(request.getFeedbackMessage().trim());
        offer.setRespondedAt(LocalDateTime.now());

        notificationService.createNotification(
                offer.getAgency(),
                NotificationType.OFFER_REJECTED,
                "Offer rejected",
                "Your offer was rejected by the traveler. Feedback: " + offer.getFeedbackMessage()
        );

        return new OfferResponse(offer.getId(), offer.getStatus(), "Offer rejected successfully!");
    }

    @Transactional(readOnly = true)
    public PageResponse<OfferListItemResponse> getOffersForAgency(String agencyEmail, Pageable pageable) {
        Account agency = findAgencyByEmail(agencyEmail);
        var page = offerRepository.findByAgencyId(agency.getId(), pageable);
        return PageResponse.from(page.map(this::toOfferListItemResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<OfferListItemResponse> getOffersForUser(String userEmail, Pageable pageable) {
        Account user = findUserByEmail(userEmail);
        var page = offerRepository.findByRequestAccountId(user.getId(), pageable);
        return PageResponse.from(page.map(this::toOfferListItemResponse));
    }

    private Account findAccountByEmail(String email) {
        return accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found!"));
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

    private TravelRequest findRequestForOfferCreation(Long requestId, Account agency) {
        TravelRequest travelRequest = travelRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Travel request not found!"));

        ensureRequestIsOpenForOffers(travelRequest);

        if (travelRequest.getAccount() != null
                && travelRequest.getAccount().getId().equals(agency.getId())) {
            throw new ForbiddenException("You cannot create an offer for your own request");
        }

        if (offerRepository.existsByRequestIdAndStatus(requestId, OfferStatus.ACCEPTED)) {
            throw new ConflictException("This request already has an accepted offer");
        }

        if (offerRepository.existsByRequestIdAndAgencyId(requestId, agency.getId())) {
            throw new ConflictException("You already have an offer for this request");
        }

        return travelRequest;
    }

    private Offer findAgencyOwnedOffer(Long offerId, Long agencyAccountId) {
        return offerRepository.findByIdAndAgencyId(offerId, agencyAccountId)
                .orElseThrow(() -> new NotFoundException("Offer not found!"));
    }

    private Offer findUserOwnedOffer(Long offerId, Long userAccountId) {
        return offerRepository.findByIdAndRequestAccountId(offerId, userAccountId)
                .orElseThrow(() -> new NotFoundException("Offer not found!"));
    }

    private void ensureRequestIsOpenForOffers(TravelRequest request) {
        if (request.getStatus() != TravelRequestStatus.PUBLISHED
                || request.getTrip() == null
                || request.getTrip().getStatus() != TripStatus.PUBLISHED) {
            throw new BadRequestException("Travel request is not open for offers");
        }
    }

    private boolean isDraftOrReady(OfferStatus status) {
        return status == OfferStatus.DRAFT || status == OfferStatus.READY;
    }

    private OfferDetailResponse toOfferDetailResponse(Offer offer) {
        return new OfferDetailResponse(
                offer.getId(),
                offer.getRequest().getId(),
                offer.getAgency().getId(),
                offer.getPrice(),
                offer.getCurrency(),
                offer.getAccommodationDetails(),
                offer.getTransportDetails(),
                offer.getItinerarySummary(),
                offer.getConditions(),
                offer.getAttachmentUrl(),
                offer.getFeedbackMessage(),
                offer.getStatus(),
                offer.getSentAt(),
                offer.getRespondedAt(),
                offer.getCreatedAt(),
                offer.getUpdatedAt()
        );
    }

    private OfferListItemResponse toOfferListItemResponse(Offer offer) {
        return new OfferListItemResponse(
                offer.getId(),
                offer.getRequest().getId(),
                offer.getPrice(),
                offer.getCurrency(),
                offer.getStatus(),
                offer.getSentAt(),
                offer.getRespondedAt(),
                offer.getCreatedAt(),
                offer.getUpdatedAt()
        );
    }
}
