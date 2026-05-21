package ro.stefanscd.tripmatch.request.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ro.stefanscd.tripmatch.request.entity.TravelRequestStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TravelRequestResponse {
    private Long requestId;
    private Long tripId;
    private TravelRequestStatus status;
    private LocalDateTime publishedAt;
    private String message;
}
