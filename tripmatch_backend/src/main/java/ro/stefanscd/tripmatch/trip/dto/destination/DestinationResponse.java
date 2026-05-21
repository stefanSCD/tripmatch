package ro.stefanscd.tripmatch.trip.dto.destination;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DestinationResponse {
    private Long destinationId;
    private String message;
}
