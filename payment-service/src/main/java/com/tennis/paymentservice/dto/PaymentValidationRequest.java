package com.tennis.paymentservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Future;

import java.time.LocalDate;

public class PaymentValidationRequest {

    @NotNull(message = "Le numéro de carte est obligatoire")
    @Pattern(regexp = "\\d{16}", message = "Le numéro de carte doit contenir 16 chiffres")
    private String cardNumber;

    @NotNull(message = "Le CVV est obligatoire")
    @Pattern(regexp = "\\d{3}", message = "Le CVV doit contenir 3 chiffres")
    private String cvv;

    @NotNull(message = "La date d'expiration est obligatoire")
    @Future(message = "La carte est expirée")
    private LocalDate expirationDate;

    public PaymentValidationRequest() {}

    public String getCardNumber() {
        return cardNumber;
    }

    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    public String getCvv() {
        return cvv;
    }

    public void setCvv(String cvv) {
        this.cvv = cvv;
    }

    public LocalDate getExpirationDate() {
        return expirationDate;
    }

    public void setExpirationDate(LocalDate expirationDate) {
        this.expirationDate = expirationDate;
    }
}