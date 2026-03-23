package ro.stefanscd.tripmatch.admin.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.admin.dto.ApprovalRequest;
import ro.stefanscd.tripmatch.admin.dto.ApprovalResponse;
import ro.stefanscd.tripmatch.admin.dto.BulkApprovalRequest;
import ro.stefanscd.tripmatch.admin.service.AgencyApprovalService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/agencies")
public class AgencyApprovalController {
    private final AgencyApprovalService agencyApprovalService;

    public AgencyApprovalController(AgencyApprovalService agencyApprovalService) {
        this.agencyApprovalService = agencyApprovalService;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ApprovalResponse>> getPendingAgencyApprovals() {
        List<ApprovalResponse> response = agencyApprovalService.findAgenciesUnapproved().stream()
                .map(this::toPendingApprovalResponse)
                .toList();

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/approve")
    public ResponseEntity<ApprovalResponse> approveOneAgency(@Valid @RequestBody ApprovalRequest request) {
        return ResponseEntity.ok(agencyApprovalService.approveOneAgency(request));
    }

    @PatchMapping("/approve/bulk")
    public ResponseEntity<List<ApprovalResponse>> approveManyAgencies(@Valid @RequestBody BulkApprovalRequest request) {
        return ResponseEntity.ok(agencyApprovalService.approveManyAgencies(request));
    }

    private ApprovalResponse toPendingApprovalResponse(Account account) {
        return new ApprovalResponse(account.getId(), false, "Pending approval");
    }
}
