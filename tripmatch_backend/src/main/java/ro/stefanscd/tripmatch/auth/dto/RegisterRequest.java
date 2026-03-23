package ro.stefanscd.tripmatch.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class RegisterRequest {
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    @NotBlank(message = "Role is required")
    private String role;
    @NotBlank(message = "Phone number is required")
    @Size(min = 5, max = 30)
    private String phone;
    @Size(max = 50)
    private String city;
    @Size(max = 50)
    private String country;
    @Size(max = 155, message = "First name must have maximum 155 characters.")
    private String firstName;
    @Size(max = 155, message = "Last name must have maximum 155 characters.")
    private String lastName;
    @Size(max = 155, message = "Agency name must have maximum 155 characters.")
    private String agencyName;
    private String agencyDescription;
}
