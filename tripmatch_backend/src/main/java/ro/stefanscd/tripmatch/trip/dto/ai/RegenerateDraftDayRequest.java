package ro.stefanscd.tripmatch.trip.dto.ai;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegenerateDraftDayRequest {
    @NotNull
    @Positive
    private Integer dayNumber;

    @Size(max = 1000)
    private String instruction;
}
