package ro.stefanscd.tripmatch.admin.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.admin.dto.ApprovalRequest;
import ro.stefanscd.tripmatch.admin.dto.ApprovalResponse;
import ro.stefanscd.tripmatch.admin.dto.BulkApprovalRequest;
import ro.stefanscd.tripmatch.common.exception.BadRequestException;
import ro.stefanscd.tripmatch.profile.entity.Profile;
import ro.stefanscd.tripmatch.profile.repository.ProfileRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AgencyApprovalService {
    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;

    public AgencyApprovalService(AccountRepository accountRepository, ProfileRepository profileRepository) {
        this.accountRepository = accountRepository;
        this.profileRepository = profileRepository;
    }

    public List<Account> findAgenciesUnapproved() {
        return accountRepository.findByIsApprovedFalseAndRole_Name("AGENCY");
    }

    @Transactional
    public ApprovalResponse approveOneAgency(ApprovalRequest request) {
        Account agencyAccount = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new BadRequestException("Account not found"));

        if (!"AGENCY".equalsIgnoreCase(agencyAccount.getRole().getName()))
            throw new BadRequestException("This account is not an agency account!");

        agencyAccount.setIsApproved(true);
        accountRepository.save(agencyAccount);

        Profile agencyProfile = profileRepository.findByAccountId(agencyAccount.getId())
                .orElseThrow(() -> new BadRequestException("Account profile is incomplete"));

        agencyProfile.setIsApproved(true);
        profileRepository.save(agencyProfile);

        return new ApprovalResponse(agencyAccount.getId(), true, "Account approved successfully!");
    }

    @Transactional
    public List<ApprovalResponse> approveManyAgencies(BulkApprovalRequest request) {
        List<ApprovalResponse> responses = new ArrayList<>();

        List<Account> accounts = accountRepository.findAllByIdIn(request.getAccountIds());
        List<Profile> profiles = profileRepository.findAllByAccountIdIn(request.getAccountIds());
        Map<Long, Account> accountMap = accounts.stream()
                .collect(Collectors.toMap(Account::getId, a -> a));

        Map<Long, Profile> profileMap = profiles.stream()
                .collect(Collectors.toMap(p -> p.getAccount().getId(), p -> p));

        for (Long accountId : request.getAccountIds()) {
            Account account = accountMap.get(accountId);
            Profile profile = profileMap.get(accountId);

            if (account == null) {
                responses.add(new ApprovalResponse(accountId, false, "Account not found"));
                continue;
            }

            if (account.getRole() == null || !"AGENCY".equalsIgnoreCase(account.getRole().getName())) {
                responses.add(new ApprovalResponse(accountId, false, "Not an agency account"));
                continue;
            }

            if (Boolean.TRUE.equals(account.getIsApproved())) {
                responses.add(new ApprovalResponse(accountId, false, "Already approved"));
                continue;
            }

            if (profile == null) {
                responses.add(new ApprovalResponse(accountId, false, "Agency profile not found"));
                continue;
            }

            account.setIsApproved(true);
            profile.setIsApproved(true);
            responses.add(new ApprovalResponse(accountId, true, "Approved successfully"));
        }

        accountRepository.saveAll(accounts);
        profileRepository.saveAll(profiles);

        return responses;
    }
}
