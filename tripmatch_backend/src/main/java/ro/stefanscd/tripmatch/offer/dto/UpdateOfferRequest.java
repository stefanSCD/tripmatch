package ro.stefanscd.tripmatch.offer.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ro.stefanscd.tripmatch.offer.entity.OfferStatus;

import java.math.BigDecimal;
import java.util.stream.Stream;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOfferRequest {
    @DecimalMin("0.01")
    private BigDecimal price;

    @Size(max = 64)
    private String currency;

    @Size(max = 512)
    private String accommodationDetails;

    @Size(max = 512)
    private String transportDetails;

    private String itinerarySummary;

    private String conditions;

    @Size(max = 1024)
    private String attachmentUrl;

    private OfferStatus status;

    @AssertTrue(message = "At least one field must be provided")
    public boolean hasAtLeastOneField() {
        return Stream.of(
                price,
                currency,
                accommodationDetails,
                transportDetails,
                itinerarySummary,
                conditions,
                attachmentUrl,
                status
        ).anyMatch(value -> value != null && (!(value instanceof String s) || !s.isBlank()));
    }
}
