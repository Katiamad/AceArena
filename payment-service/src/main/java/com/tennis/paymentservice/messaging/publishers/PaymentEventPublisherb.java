package com.tennis.paymentservice.messaging.publishers;



import com.tennis.paymentservice.messaging.events.MatchPaymentStatusEvent;
import com.tennis.paymentservice.messaging.events.PaymentStatusEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Publie les résultats de paiement vers booking-service et match-service.
 *
 *  payment.exchange ──[payment.booking.status]──→ booking-service (mode SIMPLE)
 *  payment.exchange ──[payment.match.status]────→ match-service   (mode MATCH)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventPublisherb {

    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchanges.payment-exchange:payment.exchange}")
    private String paymentExchange;

    @Value("${rabbitmq.routing-keys.payment-booking-status:payment.booking.status}")
    private String paymentBookingStatusKey;

    @Value("${rabbitmq.routing-keys.payment-match-status:payment.match.status}")
    private String paymentMatchStatusKey;

    // ── Mode SIMPLE → booking-service ────────────────────────────────────────

    public void publishBookingPaymentStatus(PaymentStatusEvent event) {
        try {
            rabbitTemplate.convertAndSend(paymentExchange, paymentBookingStatusKey, event);
            log.info("[PaymentPublisher] PaymentStatus → booking | bookingId={}, paid={}",
                    event.getBookingId(), event.isPaid());
        } catch (Exception e) {
            log.error("[PaymentPublisher] Échec PaymentStatus bookingId={} : {}",
                    event.getBookingId(), e.getMessage(), e);
        }
    }

    // ── Mode MATCH → match-service ────────────────────────────────────────────

    public void publishMatchPaymentStatus(MatchPaymentStatusEvent event) {
        try {
            rabbitTemplate.convertAndSend(paymentExchange, paymentMatchStatusKey, event);
            log.info("[PaymentPublisher] MatchPaymentStatus → match | matchId={}, bookingId={}, paid={}",
                    event.getMatchId(), event.getBookingId(), event.isPaid());
        } catch (Exception e) {
            log.error("[PaymentPublisher] Échec MatchPaymentStatus matchId={} : {}",
                    event.getMatchId(), e.getMessage(), e);
        }
    }
}