package ro.stefanscd.tripmatch.auth.service;

import org.jspecify.annotations.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.auth.dto.AuthResponse;
import ro.stefanscd.tripmatch.auth.dto.LoginRequest;
import ro.stefanscd.tripmatch.auth.dto.RegisterRequest;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.entity.Role;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.account.repository.RoleRepository;
import ro.stefanscd.tripmatch.common.exception.BadRequestException;
import ro.stefanscd.tripmatch.profile.entity.Profile;
import ro.stefanscd.tripmatch.profile.repository.ProfileRepository;

import java.time.LocalDateTime;

@Service
public class AuthService {
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AccountRepository accountRepository, RoleRepository roleRepository,
                       ProfileRepository profileRepository, PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new BadRequestException("Role not found."));

        if ("ADMIN".equalsIgnoreCase(role.getName())) {
            throw new BadRequestException("Admin accounts cannot be registered publicly.");
        }

        Account account = new Account();
        account.setEmail(request.getEmail());
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setRole(role);
        account.setIsActive(true);

        account.setIsApproved(!"AGENCY".equalsIgnoreCase(role.getName()));

        accountRepository.save(account);

        Profile profile = getProfile(request, account, role);
        profileRepository.save(profile);

        return new AuthResponse(account.getId(),"Account registered successfully!");
    }

    public AuthResponse login(LoginRequest request) {
        Account account = accountRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        boolean matches = passwordEncoder.matches(request.getPassword(), account.getPasswordHash());
        if (!matches) {
            throw new BadRequestException("Invalid email or password");
        }

        if (Boolean.FALSE.equals(account.getIsActive())) {
            throw new BadRequestException("Account is inactive.");
        }

        if (Boolean.FALSE.equals(account.getIsApproved())) {
            throw new BadRequestException("Account is not approved yet.");
        }

        account.setLastLoginAt(LocalDateTime.now());
        accountRepository.save(account);
        return new AuthResponse(account.getId(), "Login successful.");
    }

    private static @NonNull Profile getProfile(RegisterRequest request, Account account, Role role) {
        Profile profile = new Profile();
        profile.setAccount(account);
        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setCity(request.getCity());
        profile.setCountry(request.getCountry());
        profile.setPhone(request.getPhone());
        profile.setAgencyDescription(request.getAgencyDescription());
        profile.setAgencyName(request.getAgencyName());
        profile.setIsApproved("USER".equalsIgnoreCase(role.getName()));
        return profile;
    }
}
