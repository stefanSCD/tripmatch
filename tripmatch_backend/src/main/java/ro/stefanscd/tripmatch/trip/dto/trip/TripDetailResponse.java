package ro.stefanscd.tripmatch.trip.dto.trip;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ro.stefanscd.tripmatch.trip.entity.TripStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TripDetailResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean createdWithAi;
    private TripStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
