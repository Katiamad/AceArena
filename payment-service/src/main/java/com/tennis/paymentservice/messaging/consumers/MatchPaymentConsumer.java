package com.tennis.paymentservice.messaging.consumers;

import com.tennis.paymentservice.messaging.events.MatchPaymentRequestEvent;
import com.tennis.paymentservice.messaging.events.MatchPaymentStatusEvent;
import com.tennis.paymentservice.messaging.publishers.PaymentEventPublisherb;
import com.tennis.paymentservice.model.Payment;
import com.tennis.paymentservice.model.PaymentStatus;
import com.tennis.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Reçoit le paiement de la part d'UN joueur (mode MATCH).
 *
 * Chaque joueur paie pricePerPlayer séparément.
 * payment-service publie MatchPaymentStatusEvent pour chaque joueur.
 * match-service accumule et notifie booking quand TOUS ont payé.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MatchPaymentConsumer {

    private final PaymentRepository     paymentRepository;
    private final PaymentEventPublisherb publisher;

    @RabbitListener(queues = "${rabbitmq.queues.match-to-payment:match.payment.queue}")
    public void handleMatchPaymentRequest(MatchPaymentRequestEvent event) {
        log.info("[MatchPaymentConsumer] Paiement part joueur → matchId={}, userId={}, montant={}",
                event.getMatchId(), event.getUserId(), event.getPricePerPlayer());

        try {
            // Idempotence — un paiement par (matchId + userId)
            if (paymentRepository.existsByMatchIdAndUserIdAndStatusNot(
                    event.getMatchId(), Long.parseLong(event.getUserId()), PaymentStatus.FAILED)) {
                log.warn("[MatchPaymentConsumer] Paiement déjà traité matchId={} userId={}",
                        event.getMatchId(), event.getUserId());
                return;
            }

            // Créer le paiement individuel du joueur
            Payment payment = new Payment();
            payment.setBookingId(event.getBookingId());
            payment.setMatchId(event.getMatchId());
            payment.setUserId(Long.parseLong(event.getUserId()));
            payment.setAmount(event.getPricePerPlayer() != null
                    ? event.getPricePerPlayer().doubleValue() : 0.0);
            payment.setCurrency("EUR");
            payment.setPaymentMethod("MATCH_AUTO");
            payment.setStatus(PaymentStatus.PENDING);
            payment.setCreatedAt(LocalDateTime.now());
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Simulation paiement automatique
            // En prod : déclencher un checkout Stripe par joueur ici
            boolean isPaid = event.getPricePerPlayer() != null
                    && event.getPricePerPlayer().compareTo(BigDecimal.ZERO) > 0;
            String  reason = isPaid ? null : "Montant invalide";

            payment.setStatus(isPaid ? PaymentStatus.PAID : PaymentStatus.FAILED);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Publier le résultat pour CE joueur vers match-service
            publisher.publishMatchPaymentStatus(MatchPaymentStatusEvent.builder()
                    .matchId(event.getMatchId())
                    .bookingId(event.getBookingId())
                    .userId(event.getUserId())
                    .isPaid(isPaid)
                    .failureReason(reason)
                    .amountPaid(isPaid ? event.getPricePerPlayer() : BigDecimal.ZERO)
                    .processedAt(LocalDateTime.now())
                    .build());

            log.info("[MatchPaymentConsumer] matchId={} userId={} → {}",
                    event.getMatchId(), event.getUserId(), isPaid ? "PAID ✅" : "FAILED ❌");

        } catch (Exception e) {
            log.error("[MatchPaymentConsumer] Erreur matchId={} userId={} : {}",
                    event.getMatchId(), event.getUserId(), e.getMessage(), e);
            throw e;
        }
    }
}