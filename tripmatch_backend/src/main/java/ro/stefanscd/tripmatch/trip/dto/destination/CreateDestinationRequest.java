package ro.stefanscd.tripmatch.trip.dto.destination;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateDestinationRequest {
    @NotBlank
    @Size(min = 2, max = 125)
    private String city;

    @NotBlank
    @Size(min = 2, max = 125)
    private String country;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    private String notes;

    @AssertTrue(message = "endDate cannot be before startDate")
    public boolean isDateRangeValid() {
        if (startDate == null || endDate == null) {
            return true;
        }
        return !startDate.isAfter(endDate);
    }
}
