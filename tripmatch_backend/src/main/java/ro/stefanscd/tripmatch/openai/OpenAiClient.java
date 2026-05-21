package ro.stefanscd.tripmatch.openai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import ro.stefanscd.tripmatch.common.exception.BadRequestException;
import ro.stefanscd.tripmatch.common.exception.ServiceUnavailableException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Component
public class OpenAiClient {
    private static final Logger log = LoggerFactory.getLogger(OpenAiClient.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String model;

    public OpenAiClient(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${openai.api-key}") String apiKey,
            @Value("${openai.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${openai.model:gpt-5.4-mini}") String model
    ) {
        this.objectMapper = objectMapper;
        this.model = model;
        this.restClient = restClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public JsonNode generateTripDraft(String developerPrompt, String userPrompt, JsonNode schema) {
        try {
            Map<String, Object> request = Map.of(
                    "model", model,
                    "input", List.of(
                            Map.of(
                                    "role", "developer",
                                    "content", List.of(Map.of("type", "input_text", "text", developerPrompt))
                            ),
                            Map.of(
                                    "role", "user",
                                    "content", List.of(Map.of("type", "input_text", "text", userPrompt))
                            )
                    ),
                    "text", Map.of(
                            "format", Map.of(
                                    "type", "json_schema",
                                    "name", "trip_draft",
                                    "strict", true,
                                    "schema", objectMapper.convertValue(schema, Map.class)
                            )
                    )
            );

            JsonNode response = restClient.post()
                    .uri("/responses")
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);

            String outputText = extractOutputText(response);
            return objectMapper.readTree(outputText);
        } catch (RestClientResponseException ex) {
            int statusCode = ex.getStatusCode().value();
            String responseBody = ex.getResponseBodyAsString();

            log.error("OpenAI API error: status={}, body={}", statusCode, truncate(responseBody), ex);

            if (statusCode >= 400 && statusCode < 500) {
                throw new BadRequestException("AI request was rejected by OpenAI. Check AI schema/model configuration.");
            }

            throw new ServiceUnavailableException("OpenAI service is temporarily unavailable. Please retry.", ex);
        } catch (RestClientException | JacksonException | IllegalStateException ex) {
            log.error("OpenAI call failed", ex);
            throw new ServiceUnavailableException("OpenAI service is temporarily unavailable. Please retry.", ex);
        }
    }

    private String extractOutputText(JsonNode response) {
        JsonNode outputTextNode = response.path("output_text");
        if (outputTextNode.isTextual() && !outputTextNode.asText().isBlank()) {
            return outputTextNode.asText();
        }

        JsonNode output = response.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                JsonNode content = item.path("content");
                if (!content.isArray()) continue;

                for (JsonNode c : content) {
                    if ("output_text".equals(c.path("type").asText()) && c.path("text").isTextual()) {
                        return c.path("text").asText();
                    }
                }
            }
        }

        throw new IllegalStateException("OpenAI response did not contain output text");
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }
        if (value.length() <= 1500) {
            return value;
        }
        return value.substring(0, 1500) + "...";
    }
}
