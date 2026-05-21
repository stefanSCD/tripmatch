package ro.stefanscd.tripmatch.trip.dto.destination;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DestinationListResponse {
    private Long id;
    private String city;
    private String country;
    private LocalDate startDate;
    private LocalDate endDate;
    private String notes;
}
