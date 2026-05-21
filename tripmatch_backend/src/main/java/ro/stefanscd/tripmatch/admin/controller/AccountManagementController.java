package ro.stefanscd.tripmatch.admin.controller;

import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import ro.stefanscd.tripmatch.admin.dto.AdminAccountListItemResponse;
import ro.stefanscd.tripmatch.admin.dto.BlockAccountResponse;
import ro.stefanscd.tripmatch.admin.dto.UnblockAccountResponse;
import ro.stefanscd.tripmatch.admin.service.AccountManagementService;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;

@RestController
@Validated
@RequestMapping("/api/admin/accounts")
public class AccountManagementController {
    private final AccountManagementService accountManagementService;

    public AccountManagementController(AccountManagementService accountManagementService) {
        this.accountManagementService = accountManagementService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminAccountListItemResponse>> getAccounts(
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(accountManagementService.getAccounts(isActive, q, role, pageable));
    }

    @PatchMapping("/{accountId}/block")
    public ResponseEntity<BlockAccountResponse> blockAccount(
            @PathVariable @Positive Long accountId,
            Authentication authentication) {
        return ResponseEntity.ok(accountManagementService.blockAccount(accountId, authentication.getName()));
    }

    @PatchMapping("/{accountId}/unblock")
    public ResponseEntity<UnblockAccountResponse> unblockAccount(
            @PathVariable @Positive Long accountId) {
        return ResponseEntity.ok(
                accountManagementService.unblockAccount(accountId)
        );
    }
}
