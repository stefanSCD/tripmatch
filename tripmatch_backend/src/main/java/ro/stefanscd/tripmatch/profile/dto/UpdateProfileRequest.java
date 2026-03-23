package ro.stefanscd.tripmatch.profile.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.stream.Stream;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    @Size(min = 5, max = 30)
    private String phone;
    @Size(max = 500)
    private String profilePictureUrl;
    @Size(max = 50)
    private String city;
    @Size(max = 50)
    private String country;
    @Size(max = 1000)
    private String agencyDescription;

    @AssertTrue(message = "At least one field must be provided")
    public boolean hasAtLeastOneField() {
        return Stream.of(phone, profilePictureUrl, city, country, agencyDescription)
                .anyMatch(v -> v != null && !v.isBlank());
    }
}
