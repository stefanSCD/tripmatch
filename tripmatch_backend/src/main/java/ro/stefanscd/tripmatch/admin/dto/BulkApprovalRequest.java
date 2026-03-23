package ro.stefanscd.tripmatch.admin.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@NoArgsConstructor
@Getter
@Setter
public class BulkApprovalRequest {
    @NotEmpty
    private List<@NotNull @Positive Long> accountIds;
}
