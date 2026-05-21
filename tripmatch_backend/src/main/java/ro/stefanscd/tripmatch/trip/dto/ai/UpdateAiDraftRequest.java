package ro.stefanscd.tripmatch.trip.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAiDraftRequest {
    @Size(min = 2, max = 255)
    private String title;

    @Valid
    private AiDraftContentDto content;

    @AssertTrue(message = "At least one field must be provided")
    public boolean isAtLeastOneFieldProvided() {
        return hasText(title) || content != null;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
