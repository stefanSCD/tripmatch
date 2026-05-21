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
public class TravelRequestListItemResponse {
    private Long id;
    private Long tripId;
    private String destinationSummary;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isFlexibleDate;
    private TravelRequestStatus status;
    private LocalDateTime publishedAt;
}
