package ro.stefanscd.tripmatch.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.entity.Role;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.account.repository.RoleRepository;
import ro.stefanscd.tripmatch.profile.entity.Profile;
import ro.stefanscd.tripmatch.profile.repository.ProfileRepository;

@Component
public class AdminAccountSeeder implements ApplicationRunner {
    private static final String ADMIN_EMAIL = "admin@yahoo.com";
    private static final String ADMIN_PASSWORD = "Admin12345";
    private static final String ADMIN_ROLE = "ADMIN";

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAccountSeeder(AccountRepository accountRepository,
                              RoleRepository roleRepository,
                              ProfileRepository profileRepository,
                              PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (accountRepository.existsByEmail(ADMIN_EMAIL)) {
            return;
        }

        Role adminRole = roleRepository.findByName(ADMIN_ROLE)
                .orElseThrow(() -> new IllegalStateException("ADMIN role not found."));

        Account adminAccount = new Account();
        adminAccount.setRole(adminRole);
        adminAccount.setEmail(ADMIN_EMAIL);
        adminAccount.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
        adminAccount.setIsActive(true);
        adminAccount.setIsApproved(true);
        accountRepository.save(adminAccount);

        Profile adminProfile = new Profile();
        adminProfile.setAccount(adminAccount);
        adminProfile.setFirstName("System");
        adminProfile.setLastName("Admin");
        adminProfile.setPhone("0000000000");
        adminProfile.setCity("Bucharest");
        adminProfile.setCountry("Romania");
        adminProfile.setIsApproved(true);
        profileRepository.save(adminProfile);
    }
}
