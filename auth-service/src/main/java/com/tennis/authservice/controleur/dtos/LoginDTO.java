package com.tennis.authservice.controleur.dtos;

import lombok.Data;

@Data
public class LoginDTO {
    private String email;
    private String password;
}