package ro.stefanscd.tripmatch.offer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ro.stefanscd.tripmatch.offer.entity.OfferStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OfferResponse {
    private Long offerId;
    private OfferStatus status;
    private String message;
}
