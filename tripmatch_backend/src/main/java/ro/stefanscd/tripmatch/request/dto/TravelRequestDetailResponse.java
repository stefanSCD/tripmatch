package ro.stefanscd.tripmatch.request.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ro.stefanscd.tripmatch.request.entity.TravelRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TravelRequestDetailResponse {
    private Long id;
    private Long tripId;
    private Long userAccountId;
    private String sharedPreferences;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private String destinationSummary;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isFlexibleDate;
    private TravelRequestStatus status;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
