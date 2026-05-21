package ro.stefanscd.tripmatch.trip.dto.trip;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTripRequest {
    @Size(min = 2, max = 255)
    private String title;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    @AssertTrue(message = "endDate must be after startDate")
    public boolean isDateRangeValid() {
        if (startDate == null || endDate == null) {
            return true;
        }
        return !startDate.isAfter(endDate);
    }
}
