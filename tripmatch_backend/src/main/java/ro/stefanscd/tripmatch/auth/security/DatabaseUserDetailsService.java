package ro.stefanscd.tripmatch.auth.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;

import java.util.List;
import java.util.Locale;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final AccountRepository accountRepository;

    public DatabaseUserDetailsService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Account account = accountRepository.findByEmailWithRole(username)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));

        boolean enabled = Boolean.TRUE.equals(account.getIsActive()) && Boolean.TRUE.equals(account.getIsApproved());

        return User.builder()
                .username(account.getEmail())
                .password(account.getPasswordHash())
                .authorities(List.of(new SimpleGrantedAuthority(roleAuthority(account))))
                .disabled(!enabled)
                .build();
    }

    private static String roleAuthority(Account account) {
        return "ROLE_" + account.getRole().getName().toUpperCase(Locale.ROOT);
    }
}
