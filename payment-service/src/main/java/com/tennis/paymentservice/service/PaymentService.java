package com.tennis.paymentservice.service;

import com.tennis.paymentservice.model.Payment;
import com.tennis.paymentservice.model.PaymentStatus;
import com.tennis.paymentservice.repository.PaymentRepository;
import com.tennis.paymentservice.util.CardValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentEventPublisher eventPublisher;

    public PaymentService(PaymentRepository paymentRepository,
                          PaymentEventPublisher eventPublisher) {
        this.paymentRepository = paymentRepository;
        this.eventPublisher = eventPublisher;
    }

    public Payment createPayment(Payment payment) {
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCreatedAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());

        // Déterminer le type de paiement automatiquement
        if (payment.getPaymentType() == null) {
            if (payment.getMatchId() != null) {
                payment.setPaymentType("MATCH");
            } else if (payment.getBookingId() != null && payment.getBookingId() != 0) {
                payment.setPaymentType("BOOKING");
            } else if (payment.getRentalId() != null) {
                payment.setPaymentType("EQUIPMENT");
            }
        }

        // bookingId doit être non-null pour l'ancienne contrainte DB
        if (payment.getBookingId() == null) {
            payment.setBookingId(0L);
        }

        return paymentRepository.save(payment);
    }

    public Payment processPayment(Long paymentId, String cardNumber) {
        Optional<Payment> optionalPayment = paymentRepository.findById(paymentId);

        if (optionalPayment.isEmpty()) {
            throw new RuntimeException("Paiement non trouvé");
        }

        Payment payment = optionalPayment.get();
        boolean validCard = CardValidator.isValidCardNumber(cardNumber);

        if (validCard) {
            payment.setStatus(PaymentStatus.PAID);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
        }

        payment.setUpdatedAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);

        // ── Publier vers le(s) bon(s) microservice(s) ────────────────────────
        publishPaymentResult(payment, validCard);

        return saved;
    }

    /**
     * Route l'événement de paiement vers le microservice approprié
     * selon le type de paiement (BOOKING, MATCH, EQUIPMENT).
     */
    private void publishPaymentResult(Payment payment, boolean isPaid) {
        String type = payment.getPaymentType();
        String status = isPaid ? "PAID" : "FAILED";

        log.info("[PaymentService] Publication résultat → type={}, status={}", type, status);

        // Vers Equipment (si rentalId présent)
        if (payment.getRentalId() != null) {
            eventPublisher.publishToEquipment(
                    payment.getRentalId(),
                    payment.getUserId(),
                    payment.getAmount(),
                    status
            );
        }

        // Vers Match (si matchId présent)
        if (payment.getMatchId() != null) {
            eventPublisher.publishToMatch(
                    payment.getMatchId(),
                    payment.getBookingId(),
                    payment.getUserId(),
                    isPaid,
                    payment.getAmount()
            );
            return; // Match gère la communication avec Booking
        }

        // Vers Booking (si bookingId présent, non-zero, et pas de matchId)
        if (payment.getBookingId() != null && payment.getBookingId() != 0) {
            eventPublisher.publishToBooking(
                    payment.getBookingId(),
                    payment.getUserId(),
                    isPaid,
                    payment.getAmount()
            );
        }
    }

    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }
}
