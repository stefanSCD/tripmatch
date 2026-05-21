package ro.stefanscd.tripmatch.profile.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ro.stefanscd.tripmatch.profile.dto.UpdateProfileRequest;
import ro.stefanscd.tripmatch.profile.dto.ProfileResponse;
import ro.stefanscd.tripmatch.profile.service.ProfileService;

@RestController
@RequestMapping("/api/accounts/{accountId}/profile")
public class ProfileController {
    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @PatchMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @PathVariable Long accountId,
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(profileService.update(accountId, request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfileById(
            @PathVariable Long accountId,
            Authentication authentication
    ){
        return ResponseEntity.ok(profileService.findByAccountId(accountId, authentication.getName()));
    }
}
