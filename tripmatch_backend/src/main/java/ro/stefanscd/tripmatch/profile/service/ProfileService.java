package ro.stefanscd.tripmatch.profile.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.common.exception.ForbiddenException;
import ro.stefanscd.tripmatch.common.exception.NotFoundException;
import ro.stefanscd.tripmatch.profile.dto.ProfileResponse;
import ro.stefanscd.tripmatch.profile.dto.UpdateProfileRequest;
import ro.stefanscd.tripmatch.profile.entity.Profile;
import ro.stefanscd.tripmatch.profile.repository.ProfileRepository;

@Service
public class ProfileService {
    private final ProfileRepository profileRepository;
    private final AccountRepository accountRepository;

    public ProfileService(ProfileRepository profileRepository, AccountRepository accountRepository) {
        this.profileRepository = profileRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public ProfileResponse update(Long accountId, UpdateProfileRequest request, String currentEmail) {
        Account current = accountRepository.findByEmailWithRole(currentEmail)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        boolean isOwner = current.getId().equals(accountId);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(current.getRole().getName());

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You cannot edit another user's profile");
        }
        Profile profile = profileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Profile not found for this accountId"));

        if (request.getCity() != null) profile.setCity(request.getCity());
        if (request.getCountry() != null) profile.setCountry(request.getCountry());
        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getAgencyDescription() != null) profile.setAgencyDescription(request.getAgencyDescription());
        if (request.getProfilePictureUrl() != null) profile.setProfilePictureUrl(request.getProfilePictureUrl());

        return toProfileResponse(profile);
    }

    @Transactional(readOnly = true)
    public ProfileResponse findByAccountId(Long accountId, String email) {
        Account current = accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        if(!current.getId().equals(accountId))
            throw new ForbiddenException("You cannot modify other's profile");

        Profile profile = profileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new NotFoundException("Profile not found!"));

        return toProfileResponse(profile);
    }

    private static ProfileResponse toProfileResponse(Profile profile) {
        return new ProfileResponse(profile.getFirstName(), profile.getLastName(), profile.getPhone(),
                profile.getProfilePictureUrl(), profile.getCity(), profile.getCountry(), profile.getAgencyDescription(),
                profile.getAgencyName(), profile.getIsApproved());
    }
}
