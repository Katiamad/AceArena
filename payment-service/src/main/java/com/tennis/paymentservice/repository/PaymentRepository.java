package com.tennis.paymentservice.repository;

import com.tennis.paymentservice.model.Payment;
import com.tennis.paymentservice.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /** Idempotence mode SIMPLE */
    boolean existsByBookingIdAndStatusNot(Long bookingId, PaymentStatus status);

    /**
     * Idempotence mode MATCH — un paiement par joueur par match.
     * Évite de retraiter si RabbitMQ re-livre.
     */
    boolean existsByMatchIdAndUserIdAndStatusNot(Long matchId, Long userId, PaymentStatus status);
}