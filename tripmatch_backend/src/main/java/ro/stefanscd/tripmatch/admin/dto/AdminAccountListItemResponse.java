package ro.stefanscd.tripmatch.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminAccountListItemResponse {
    private Long id;
    private String email;
    private String role;
    private Boolean isActive;
    private Boolean isApproved;
    private String firstName;
    private String lastName;
    private String agencyName;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
}
