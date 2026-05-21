package ro.stefanscd.tripmatch.admin.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.admin.dto.AdminAccountListItemResponse;
import ro.stefanscd.tripmatch.admin.dto.BlockAccountResponse;
import ro.stefanscd.tripmatch.admin.dto.UnblockAccountResponse;
import ro.stefanscd.tripmatch.common.exception.BadRequestException;
import ro.stefanscd.tripmatch.common.exception.ForbiddenException;
import ro.stefanscd.tripmatch.common.exception.NotFoundException;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;

import java.util.Locale;
import java.util.Set;

@Service
public class AccountManagementService {
    private final AccountRepository accountRepository;

    public AccountManagementService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public BlockAccountResponse blockAccount(Long accountId, String email) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new NotFoundException("Account not found!"));

        Account adminAccount = accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Admin account not found!"));

        if (account.getId().equals(adminAccount.getId())) {
            throw new ForbiddenException("Admin cannot block his account!");
        }

        account.setIsActive(false);
        accountRepository.save(account);
        return new BlockAccountResponse("Account blocked successfully!");
    }

    public UnblockAccountResponse unblockAccount(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new NotFoundException("Account not found!"));

        account.setIsActive(true);
        accountRepository.save(account);
        return new UnblockAccountResponse("Account unblocked successfully!");
    }

    public PageResponse<AdminAccountListItemResponse> getAccounts(Boolean isActive, String q, String role, Pageable pageable) {
        String normalizedQ = (q == null || q.isBlank()) ? null : q.trim();
        String normalizedRole = (role == null || role.isBlank()) ? null : role.trim().toUpperCase(Locale.ROOT);

        if (normalizedRole != null && !Set.of("USER", "AGENCY", "ADMIN").contains(normalizedRole)) {
            throw new BadRequestException("Invalid role filter");
        }

        Page<AdminAccountListItemResponse> page = normalizedQ == null
                ? accountRepository.findAdminAccounts(isActive, normalizedRole, pageable)
                : accountRepository.searchAdminAccounts(isActive, normalizedRole, normalizedQ, pageable);

        return PageResponse.from(page);
    }
}
