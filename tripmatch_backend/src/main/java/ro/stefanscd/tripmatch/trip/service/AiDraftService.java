package ro.stefanscd.tripmatch.trip.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.stefanscd.tripmatch.account.entity.Account;
import ro.stefanscd.tripmatch.account.repository.AccountRepository;
import ro.stefanscd.tripmatch.common.exception.BadRequestException;
import ro.stefanscd.tripmatch.common.exception.NotFoundException;
import ro.stefanscd.tripmatch.openai.OpenAiClient;
import ro.stefanscd.tripmatch.trip.dto.PageResponse;
import ro.stefanscd.tripmatch.trip.dto.ai.AiDraftActivityDto;
import ro.stefanscd.tripmatch.trip.dto.ai.AiDraftContentDto;
import ro.stefanscd.tripmatch.trip.dto.ai.AiDraftDayDto;
import ro.stefanscd.tripmatch.trip.dto.ai.AiDraftDetailResponse;
import ro.stefanscd.tripmatch.trip.dto.ai.AiDraftListItemResponse;
import ro.stefanscd.tripmatch.trip.dto.ai.GenerateAiDraftRequest;
import ro.stefanscd.tripmatch.trip.dto.ai.RegenerateDraftDayRequest;
import ro.stefanscd.tripmatch.trip.dto.ai.SaveDraftAsTripRequest;
import ro.stefanscd.tripmatch.trip.dto.ai.UpdateAiDraftRequest;
import ro.stefanscd.tripmatch.trip.dto.trip.TripResponse;
import ro.stefanscd.tripmatch.trip.entity.Activity;
import ro.stefanscd.tripmatch.trip.entity.AiGeneratedDraft;
import ro.stefanscd.tripmatch.trip.entity.BudgetCategory;
import ro.stefanscd.tripmatch.trip.entity.Destination;
import ro.stefanscd.tripmatch.trip.entity.Trip;
import ro.stefanscd.tripmatch.trip.repository.ActivityRepository;
import ro.stefanscd.tripmatch.trip.repository.AiGeneratedDraftRepository;
import ro.stefanscd.tripmatch.trip.repository.DestinationRepository;
import ro.stefanscd.tripmatch.trip.repository.TripRepository;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AiDraftService {
    private static final String FULL_DRAFT_SCHEMA_JSON = """
            {
              "type": "object",
              "additionalProperties": false,
              "required": ["title", "description", "startDate", "endDate", "primaryDestination", "estimatedTotal", "currency", "days"],
              "properties": {
                "title": {"type": "string", "minLength": 2, "maxLength": 255},
                "description": {"type": "string", "maxLength": 4000},
                "startDate": {"type": "string", "format": "date"},
                "endDate": {"type": "string", "format": "date"},
                "primaryDestination": {"type": "string", "maxLength": 255},
                "estimatedTotal": {"type": "number", "minimum": 0},
                "currency": {"type": "string", "maxLength": 64},
                "days": {
                  "type": "array",
                  "minItems": 1,
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["dayNumber", "date", "summary", "estimatedCostTotal", "activities"],
                    "properties": {
                      "dayNumber": {"type": "integer", "minimum": 1},
                      "date": {"type": "string", "format": "date"},
                      "summary": {"type": "string", "maxLength": 2000},
                      "estimatedCostTotal": {"type": "number", "minimum": 0},
                      "activities": {
                        "type": "array",
                        "minItems": 1,
                        "items": {
                          "type": "object",
                          "additionalProperties": false,
                          "required": ["title", "location", "activityDate", "startTime", "durationMinutes", "estimatedCost", "notes"],
                          "properties": {
                            "title": {"type": "string", "maxLength": 255},
                            "location": {"type": "string", "maxLength": 255},
                            "activityDate": {"type": "string", "format": "date"},
                            "startTime": {"type": "string"},
                            "durationMinutes": {"type": "integer", "minimum": 1},
                            "estimatedCost": {"type": "number", "minimum": 0.01},
                            "notes": {"type": "string", "maxLength": 2000}
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

    private static final String DAY_SCHEMA_JSON = """
            {
              "type": "object",
              "additionalProperties": false,
              "required": ["dayNumber", "date", "summary", "estimatedCostTotal", "activities"],
              "properties": {
                "dayNumber": {"type": "integer", "minimum": 1},
                "date": {"type": "string", "format": "date"},
                "summary": {"type": "string", "maxLength": 2000},
                "estimatedCostTotal": {"type": "number", "minimum": 0},
                "activities": {
                  "type": "array",
                  "minItems": 1,
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["title", "location", "activityDate", "startTime", "durationMinutes", "estimatedCost", "notes"],
                    "properties": {
                      "title": {"type": "string", "maxLength": 255},
                      "location": {"type": "string", "maxLength": 255},
                      "activityDate": {"type": "string", "format": "date"},
                      "startTime": {"type": "string"},
                      "durationMinutes": {"type": "integer", "minimum": 1},
                      "estimatedCost": {"type": "number", "minimum": 0.01},
                      "notes": {"type": "string", "maxLength": 2000}
                    }
                  }
                }
              }
            }
            """;

    private final AiGeneratedDraftRepository aiGeneratedDraftRepository;
    private final AccountRepository accountRepository;
    private final TripRepository tripRepository;
    private final DestinationRepository destinationRepository;
    private final ActivityRepository activityRepository;
    private final OpenAiClient openAiClient;
    private final ObjectMapper objectMapper;
    private final JsonNode fullDraftSchema;
    private final JsonNode daySchema;

    public AiDraftService(AiGeneratedDraftRepository aiGeneratedDraftRepository,
                          AccountRepository accountRepository,
                          TripRepository tripRepository,
                          DestinationRepository destinationRepository,
                          ActivityRepository activityRepository,
                          OpenAiClient openAiClient,
                          ObjectMapper objectMapper) {
        this.aiGeneratedDraftRepository = aiGeneratedDraftRepository;
        this.accountRepository = accountRepository;
        this.tripRepository = tripRepository;
        this.destinationRepository = destinationRepository;
        this.activityRepository = activityRepository;
        this.openAiClient = openAiClient;
        this.objectMapper = objectMapper;
        this.fullDraftSchema = readSchema(FULL_DRAFT_SCHEMA_JSON);
        this.daySchema = readSchema(DAY_SCHEMA_JSON);
    }

    @Transactional
    public AiDraftDetailResponse generateTrip(GenerateAiDraftRequest request, String email) {
        Account account = findAccountByEmail(email);

        JsonNode aiResponse = openAiClient.generateTripDraft(
                buildGenerateDeveloperPrompt(),
                buildGenerateUserPrompt(request),
                fullDraftSchema
        );

        AiDraftContentDto generatedContent = toAiDraftContentDto(aiResponse);
        normalizeEstimatedTotals(generatedContent);

        AiGeneratedDraft draft = new AiGeneratedDraft();
        draft.setAccount(account);
        draft.setTitle(generatedContent.getTitle());
        draft.setPromptData(writeAsJson(request));
        draft.setGeneratedContent(writeAsJson(generatedContent));

        aiGeneratedDraftRepository.save(draft);
        return toDetailResponse(draft, request, generatedContent);
    }

    @Transactional(readOnly = true)
    public AiDraftDetailResponse getDraftById(Long id, String email) {
        Account account = findAccountByEmail(email);
        AiGeneratedDraft draft = findDraftByIdAndAccount(id, account.getId());

        GenerateAiDraftRequest promptData = readPromptData(draft);
        AiDraftContentDto content = readGeneratedContent(draft);

        return toDetailResponse(draft, promptData, content);
    }

    @Transactional(readOnly = true)
    public PageResponse<AiDraftListItemResponse> getDrafts(String email, Pageable pageable) {
        Account account = findAccountByEmail(email);
        Page<AiGeneratedDraft> page = aiGeneratedDraftRepository.findByAccountId(account.getId(), pageable);

        return PageResponse.from(page.map(this::toListItemResponse));
    }

    @Transactional
    public AiDraftDetailResponse updateDraft(Long id, UpdateAiDraftRequest request, String email) {
        Account account = findAccountByEmail(email);
        AiGeneratedDraft draft = findDraftByIdAndAccount(id, account.getId());

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            draft.setTitle(request.getTitle().trim());
        }

        if (request.getContent() != null) {
            normalizeEstimatedTotals(request.getContent());
            draft.setGeneratedContent(writeAsJson(request.getContent()));
        }

        aiGeneratedDraftRepository.save(draft);

        GenerateAiDraftRequest promptData = readPromptData(draft);
        AiDraftContentDto content = request.getContent() != null ? request.getContent() : readGeneratedContent(draft);

        return toDetailResponse(draft, promptData, content);
    }

    @Transactional
    public TripResponse saveAsTrip(Long id, SaveDraftAsTripRequest request, String email) {
        Account account = findAccountByEmail(email);
        AiGeneratedDraft draft = findDraftByIdAndAccount(id, account.getId());
        AiDraftContentDto content = readGeneratedContent(draft);

        Trip trip = new Trip();
        trip.setAccount(account);
        trip.setTitle(resolveTripTitle(content, request));
        trip.setDescription(content.getDescription());
        trip.setStartDate(content.getStartDate());
        trip.setEndDate(content.getEndDate());
        trip.setCreatedWithAi(true);
        tripRepository.save(trip);

        List<Destination> destinations = buildDestinationsForTrip(content, trip);
        if (!destinations.isEmpty()) {
            destinations = destinationRepository.saveAll(destinations);
        }

        List<Activity> activities = buildActivitiesForTrip(content, trip, destinations);
        if (!activities.isEmpty()) {
            activityRepository.saveAll(activities);
        }

        return new TripResponse(trip.getId(), "Trip created from AI draft successfully!");
    }

    @Transactional
    public AiDraftDetailResponse regenerateDraft(Long id, RegenerateDraftDayRequest request, String email) {
        Account account = findAccountByEmail(email);
        AiGeneratedDraft draft = findDraftByIdAndAccount(id, account.getId());

        GenerateAiDraftRequest promptData = readPromptData(draft);
        AiDraftContentDto content = readGeneratedContent(draft);

        int dayIndex = findDayIndex(content, request.getDayNumber());
        AiDraftDayDto currentDay = content.getDays().get(dayIndex);

        JsonNode regeneratedDayNode = openAiClient.generateTripDraft(
                buildRegenerateDayDeveloperPrompt(),
                buildRegenerateDayUserPrompt(promptData, content, request, currentDay),
                daySchema
        );

        AiDraftDayDto regeneratedDay = toAiDraftDayDto(regeneratedDayNode);
        regeneratedDay.setDayNumber(request.getDayNumber());

        content.getDays().set(dayIndex, regeneratedDay);
        normalizeEstimatedTotals(content);

        draft.setGeneratedContent(writeAsJson(content));
        aiGeneratedDraftRepository.save(draft);

        return toDetailResponse(draft, promptData, content);
    }

    private Account findAccountByEmail(String email) {
        return accountRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found!"));
    }

    private AiGeneratedDraft findDraftByIdAndAccount(Long draftId, Long accountId) {
        return aiGeneratedDraftRepository.findByIdAndAccountId(draftId, accountId)
                .orElseThrow(() -> new NotFoundException("AI draft not found!"));
    }

    private AiDraftDetailResponse toDetailResponse(AiGeneratedDraft draft,
                                                   GenerateAiDraftRequest promptData,
                                                   AiDraftContentDto content) {
        return new AiDraftDetailResponse(
                draft.getId(),
                draft.getTitle(),
                promptData,
                content,
                draft.getCreatedAt(),
                draft.getUpdatedAt()
        );
    }

    private AiDraftListItemResponse toListItemResponse(AiGeneratedDraft draft) {
        AiDraftContentDto content = readGeneratedContent(draft);
        return new AiDraftListItemResponse(
                draft.getId(),
                draft.getTitle(),
                content.getStartDate(),
                content.getEndDate(),
                content.getCurrency(),
                content.getEstimatedTotal(),
                draft.getCreatedAt(),
                draft.getUpdatedAt()
        );
    }

    private GenerateAiDraftRequest readPromptData(AiGeneratedDraft draft) {
        try {
            return objectMapper.readValue(draft.getPromptData(), GenerateAiDraftRequest.class);
        } catch (JacksonException e) {
            throw new IllegalStateException("Invalid prompt_data in AI draft", e);
        }
    }

    private AiDraftContentDto readGeneratedContent(AiGeneratedDraft draft) {
        if (draft.getGeneratedContent() == null || draft.getGeneratedContent().isBlank()) {
            throw new BadRequestException("AI draft has no generated content yet");
        }

        try {
            AiDraftContentDto content = objectMapper.readValue(draft.getGeneratedContent(), AiDraftContentDto.class);
            normalizeEstimatedTotals(content);
            return content;
        } catch (JacksonException e) {
            throw new IllegalStateException("Invalid generated_content in AI draft", e);
        }
    }

    private AiDraftContentDto toAiDraftContentDto(JsonNode jsonNode) {
        try {
            AiDraftContentDto content = objectMapper.treeToValue(jsonNode, AiDraftContentDto.class);
            normalizeEstimatedTotals(content);
            return content;
        } catch (JacksonException e) {
            throw new IllegalStateException("AI returned an invalid draft format", e);
        }
    }

    private AiDraftDayDto toAiDraftDayDto(JsonNode jsonNode) {
        try {
            AiDraftDayDto day = objectMapper.treeToValue(jsonNode, AiDraftDayDto.class);
            normalizeDayEstimatedTotal(day);
            return day;
        } catch (JacksonException e) {
            throw new IllegalStateException("AI returned an invalid day format", e);
        }
    }

    private void normalizeEstimatedTotals(AiDraftContentDto content) {
        if (content.getDays() == null) {
            content.setDays(new ArrayList<>());
        }

        for (AiDraftDayDto day : content.getDays()) {
            normalizeDayEstimatedTotal(day);
        }

        BigDecimal total = content.getDays().stream()
                .map(AiDraftDayDto::getEstimatedCostTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (content.getEstimatedTotal() == null || content.getEstimatedTotal().compareTo(BigDecimal.ZERO) < 0) {
            content.setEstimatedTotal(total);
        }

        if (content.getCurrency() != null) {
            content.setCurrency(content.getCurrency().trim().toUpperCase(Locale.ROOT));
        }
    }

    private void normalizeDayEstimatedTotal(AiDraftDayDto day) {
        if (day.getActivities() == null) {
            day.setActivities(new ArrayList<>());
        }

        BigDecimal dayTotal = day.getActivities().stream()
                .map(AiDraftActivityDto::getEstimatedCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        if (day.getEstimatedCostTotal() == null || day.getEstimatedCostTotal().compareTo(BigDecimal.ZERO) < 0) {
            day.setEstimatedCostTotal(dayTotal);
        } else {
            day.setEstimatedCostTotal(day.getEstimatedCostTotal().setScale(2, RoundingMode.HALF_UP));
        }
    }

    private List<Destination> buildDestinationsForTrip(AiDraftContentDto content, Trip trip) {
        List<Destination> destinations = new ArrayList<>();
        if (content.getDays() == null || content.getDays().isEmpty()) {
            return destinations;
        }

        String primaryDestination = content.getPrimaryDestination() == null ? "" : content.getPrimaryDestination().trim();
        String city = primaryDestination;
        String country = "Unknown";

        int commaIndex = primaryDestination.indexOf(',');
        if (commaIndex > 0) {
            city = primaryDestination.substring(0, commaIndex).trim();
            String rest = primaryDestination.substring(commaIndex + 1).trim();
            if (!rest.isEmpty()) {
                country = rest;
            }
        }

        if (city.isBlank()) {
            city = "Destination";
        }

        for (AiDraftDayDto day : content.getDays()) {
            Destination destination = new Destination();
            destination.setTrip(trip);
            destination.setCity(city);
            destination.setCountry(country);
            var dayDate = day != null && day.getDate() != null ? day.getDate() : content.getStartDate();
            destination.setStartDate(dayDate);
            destination.setEndDate(dayDate);
            destination.setNotes(day != null ? day.getSummary() : content.getDescription());
            destinations.add(destination);
        }

        return destinations;
    }

    private List<Activity> buildActivitiesForTrip(AiDraftContentDto content, Trip trip, List<Destination> destinations) {
        List<Activity> activities = new ArrayList<>();

        if (content.getDays() == null || destinations == null || destinations.isEmpty()) {
            return activities;
        }

        int maxDays = Math.min(content.getDays().size(), destinations.size());
        for (int dayIndex = 0; dayIndex < maxDays; dayIndex++) {
            AiDraftDayDto day = content.getDays().get(dayIndex);
            Destination destination = destinations.get(dayIndex);
            if (day == null || day.getActivities() == null) {
                continue;
            }

            int displayOrder = 0;
            for (AiDraftActivityDto source : day.getActivities()) {
                Activity activity = new Activity();
                activity.setTrip(trip);
                activity.setDestination(destination);
                activity.setTitle(source.getTitle());
                activity.setLocation(source.getLocation());
                activity.setActivityDate(source.getActivityDate());
                activity.setStartTime(source.getStartTime());
                activity.setDurationMinutes(source.getDurationMinutes());
                activity.setEstimatedCost(source.getEstimatedCost().setScale(2, RoundingMode.HALF_UP));
                activity.setNotes(source.getNotes());
                activity.setCategory(BudgetCategory.ACTIVITIES);
                activity.setDisplayOrder(displayOrder++);
                activities.add(activity);
            }
        }

        return activities;
    }

    private int findDayIndex(AiDraftContentDto content, Integer dayNumber) {
        if (content.getDays() == null || content.getDays().isEmpty()) {
            throw new BadRequestException("Draft has no days to regenerate");
        }

        for (int i = 0; i < content.getDays().size(); i++) {
            AiDraftDayDto day = content.getDays().get(i);
            if (day.getDayNumber() != null && day.getDayNumber().equals(dayNumber)) {
                return i;
            }
        }

        throw new BadRequestException("Day not found in draft: " + dayNumber);
    }

    private JsonNode readSchema(String schemaJson) {
        try {
            return objectMapper.readTree(schemaJson);
        } catch (JacksonException e) {
            throw new IllegalStateException("Invalid JSON schema for AI drafting", e);
        }
    }

    private String writeAsJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException e) {
            throw new IllegalStateException("Could not serialize AI draft payload", e);
        }
    }

    private String buildGenerateDeveloperPrompt() {
        return """
                You are a travel planning assistant.
                Generate a realistic trip draft in JSON only.
                Respect exactly the JSON schema.
                Use coherent dates and place activityDate inside the trip date range.
                Keep estimates realistic and positive.
                Return only JSON without markdown.
                """;
    }

    private String buildGenerateUserPrompt(GenerateAiDraftRequest request) {
        String interests = request.getInterests() == null || request.getInterests().isEmpty()
                ? "none"
                : request.getInterests().stream().collect(Collectors.joining(", "));

        return """
                Create a trip draft with these preferences:
                destinationHint: %s
                tripType: %s
                startDate: %s
                endDate: %s
                budgetTotal: %s
                currency: %s
                pace: %s
                interests: %s
                notes: %s
                """.formatted(
                safeText(request.getDestinationHint()),
                safeText(request.getTripType()),
                request.getStartDate(),
                request.getEndDate(),
                request.getBudgetTotal(),
                safeText(request.getCurrency()),
                safeText(request.getPace()),
                interests,
                safeText(request.getNotes())
        );
    }

    private String buildRegenerateDayDeveloperPrompt() {
        return """
                You are a travel planning assistant.
                Regenerate exactly one day plan in JSON only.
                Respect exactly the JSON schema.
                Keep activityDate aligned with the requested day date.
                Keep estimates realistic and positive.
                Return only JSON without markdown.
                """;
    }

    private String buildRegenerateDayUserPrompt(GenerateAiDraftRequest promptData,
                                                AiDraftContentDto currentDraft,
                                                RegenerateDraftDayRequest request,
                                                AiDraftDayDto currentDay) {
        return """
                Regenerate day %s from this trip.
                Trip title: %s
                Primary destination: %s
                Date range: %s to %s
                Budget total: %s %s
                Pace: %s
                Interests: %s
                Existing day date: %s
                Existing day summary: %s
                Additional instruction: %s
                Keep it coherent with the rest of the trip and do not change the day number.
                """.formatted(
                request.getDayNumber(),
                safeText(currentDraft.getTitle()),
                safeText(currentDraft.getPrimaryDestination()),
                currentDraft.getStartDate(),
                currentDraft.getEndDate(),
                promptData.getBudgetTotal(),
                safeText(promptData.getCurrency()),
                safeText(promptData.getPace()),
                promptData.getInterests() == null ? "none" : String.join(", ", promptData.getInterests()),
                currentDay.getDate(),
                safeText(currentDay.getSummary()),
                safeText(request.getInstruction())
        );
    }

    private String safeText(String value) {
        return value == null || value.isBlank() ? "-" : value.trim();
    }

    private String resolveTripTitle(AiDraftContentDto content, SaveDraftAsTripRequest request) {
        if (request == null || request.getTripTitleOverride() == null) {
            return content.getTitle();
        }

        String override = request.getTripTitleOverride().trim();
        if (override.isEmpty()) {
            throw new BadRequestException("tripTitleOverride cannot be blank");
        }

        return override;
    }
}
