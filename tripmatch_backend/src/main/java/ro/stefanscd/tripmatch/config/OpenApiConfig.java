package ro.stefanscd.tripmatch.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI tripmatchOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Tripmatch API")
                        .description("Documentatie OpenAPI pentru backend-ul Tripmatch.")
                        .version("v1"));
    }
}
