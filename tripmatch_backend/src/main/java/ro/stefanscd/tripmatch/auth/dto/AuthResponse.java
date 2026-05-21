package ro.stefanscd.tripmatch.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthResponse {
    private Long accountId;
    private String message;
    public AuthResponse(Long accountId, String message){
        this.message = message;
        this.accountId = accountId;
    }
}