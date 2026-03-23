package ro.stefanscd.tripmatch.profile.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.common.exception.NotFoundException;
import ro.stefanscd.tripmatch.profile.dto.ProfileResponse;
import ro.stefanscd.tripmatch.profile.dto.UpdateProfileRequest;
import ro.stefanscd.tripmatch.profile.entity.Profile;
import ro.stefanscd.tripmatch.profile.repository.ProfileRepository;

@Service
public class ProfileService {
    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Transactional
    public ProfileResponse update(Long accountId, UpdateProfileRequest request) {
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
    public ProfileResponse findByAccountId(Long accountId) {
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
