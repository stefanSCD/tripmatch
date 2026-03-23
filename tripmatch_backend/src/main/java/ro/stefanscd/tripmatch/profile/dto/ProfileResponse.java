package ro.stefanscd.tripmatch.profile.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private String firstName;
    private String lastName;
    private String phone;
    private String profilePictureUrl;
    private String city;
    private String country;
    private String agencyDescription;
    private String agencyName;
    private Boolean isApproved;
}
