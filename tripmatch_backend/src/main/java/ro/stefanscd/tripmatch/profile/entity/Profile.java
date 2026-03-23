package ro.stefanscd.tripmatch.profile.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ro.stefanscd.tripmatch.account.entity.Account;

import java.time.LocalDateTime;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Table(name = "profiles")
public class Profile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;
    @Column(name = "first_name", nullable = true, length = 155)
    private String firstName;
    @Column(name = "last_name", nullable = true, length = 155)
    private String lastName;
    @Column(nullable = false, length = 30)
    private String phone;
    @Column(name = "profile_picture_url", nullable = true, length = 500)
    private String profilePictureUrl;
    @Column(nullable = true, length = 50)
    private String city;
    @Column(nullable = true, length = 50)
    private String country;
    @Column(name = "agency_name", nullable = true, length = 155)
    private String agencyName;
    @Column(name = "agency_description", columnDefinition = "TEXT")
    private String agencyDescription;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
