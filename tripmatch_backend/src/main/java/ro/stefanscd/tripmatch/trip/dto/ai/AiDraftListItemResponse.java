package ro.stefanscd.tripmatch.trip.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiDraftListItemResponse {
    private Long id;
    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
    private String currency;
    private BigDecimal estimatedTotal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
