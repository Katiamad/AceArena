package com.tennis.paymentservice.controller;

import com.tennis.paymentservice.dto.PaymentValidationRequest;
import com.tennis.paymentservice.model.Payment;
import com.tennis.paymentservice.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<Payment> createPayment(
            @RequestBody Payment payment,
            JwtAuthenticationToken authentication
    ) {

        // LOG temporaire
        System.out.println("=== CLAIMS JWT ===");
        authentication.getTokenAttributes().forEach((k, v) ->
                System.out.println(k + " = " + v));
        System.out.println("==================");
        Long userId = Long.parseLong(authentication.getName());
        String firstName = (String) authentication.getTokenAttributes().get("firstName");
        String lastName = (String) authentication.getTokenAttributes().get("lastName");

        payment.setUserId(userId);
        payment.setUserFirstName(firstName);
        payment.setUserLastName(lastName);

        Payment createdPayment = paymentService.createPayment(payment);
        return ResponseEntity.ok(createdPayment);
    }

    @PostMapping("/{id}/process")
    public ResponseEntity<Payment> processPayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentValidationRequest request,
            JwtAuthenticationToken authentication
    ) {
        Long userId = Long.parseLong(authentication.getName());

        Payment processedPayment = paymentService.processPayment(id, request.getCardNumber());
        return ResponseEntity.ok(processedPayment);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(
            @PathVariable Long id,
            JwtAuthenticationToken authentication
    ) {
        Optional<Payment> payment = paymentService.getPaymentById(id);
        return payment
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}