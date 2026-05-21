package ro.stefanscd.tripmatch.offer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ro.stefanscd.tripmatch.offer.entity.OfferStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OfferDetailResponse {
    private Long id;
    private Long requestId;
    private Long agencyAccountId;
    private BigDecimal price;
    private String currency;
    private String accommodationDetails;
    private String transportDetails;
    private String itinerarySummary;
    private String conditions;
    private String attachmentUrl;
    private String feedbackMessage;
    private OfferStatus status;
    private LocalDateTime sentAt;
    private LocalDateTime respondedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
