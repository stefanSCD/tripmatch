package ro.stefanscd.tripmatch.trip.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiDraftDetailResponse {
    private Long id;
    private String title;
    private GenerateAiDraftRequest promptData;
    private AiDraftContentDto content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
