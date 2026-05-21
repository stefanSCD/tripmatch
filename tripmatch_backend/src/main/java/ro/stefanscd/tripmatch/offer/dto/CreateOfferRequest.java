package ro.stefanscd.tripmatch.offer.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateOfferRequest {
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal price;

    @NotBlank
    @Size(max = 64)
    private String currency;

    @NotBlank
    @Size(max = 512)
    private String accommodationDetails;

    @NotBlank
    @Size(max = 512)
    private String transportDetails;

    private String itinerarySummary;

    private String conditions;

    @Size(max = 1024)
    private String attachmentUrl;
}
