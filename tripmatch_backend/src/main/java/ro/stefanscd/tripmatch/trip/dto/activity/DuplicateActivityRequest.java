package ro.stefanscd.tripmatch.trip.dto.activity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateActivityRequest {
    private LocalDate activityDate;
    private LocalTime startTime;
    private Boolean allowOverlap;
}
