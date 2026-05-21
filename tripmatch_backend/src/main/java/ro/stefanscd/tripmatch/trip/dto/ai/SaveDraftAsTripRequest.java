package ro.stefanscd.tripmatch.trip.dto.ai;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SaveDraftAsTripRequest {
    @Size(min = 2, max = 255)
    private String tripTitleOverride;
}
