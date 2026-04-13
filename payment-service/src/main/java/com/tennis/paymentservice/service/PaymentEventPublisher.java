package com.tennis.paymentservice.service;

import com.tennis.paymentservice.config.PaymentRabbitMQConfig;
import com.tennis.paymentservice.events.BookingPaymentStatusEvent;
import com.tennis.paymentservice.events.MatchPaymentStatusEvent;
import com.tennis.paymentservice.events.PaymentEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Publisher général qui envoie les résultats de paiement vers les 3 microservices :
 *   - Equipment : via payment.event.queue (direct queue)
 *   - Booking   : via payment.exchange / payment.booking.status
 *   - Match     : via payment.exchange / payment.match.status
 */
@Slf4j
@Service
public class PaymentEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchanges.payment-exchange:payment.exchange}")
    private String paymentExchange;

    @Value("${rabbitmq.routing-keys.payment-booking-status:payment.booking.status}")
    private String paymentBookingStatusKey;

    @Value("${rabbitmq.routing-keys.payment-match-status:payment.match.status}")
    private String paymentMatchStatusKey;

    public PaymentEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    // ── Vers Equipment ───────────────────────────────────────────────────────────

    public void publishToEquipment(Long rentalId, Long userId, Double amount, String status) {
        PaymentEvent event = new PaymentEvent(rentalId, userId, amount, status);
        rabbitTemplate.convertAndSend(PaymentRabbitMQConfig.PAYMENT_EVENT_QUEUE, event);
        log.info("[PaymentPublisher] → Equipment : rentalId={}, status={}", rentalId, status);
    }

    // ── Vers Booking ─────────────────────────────────────────────────────────────

    public void publishToBooking(Long bookingId, Long userId, boolean isPaid, Double amount) {
        BookingPaymentStatusEvent event = BookingPaymentStatusEvent.builder()
                .bookingId(bookingId)
                .userId(userId.toString())
                .isPaid(isPaid)
                .failureReason(isPaid ? null : "Carte invalide")
                .amountPaid(BigDecimal.valueOf(amount))
                .processedAt(LocalDateTime.now())
                .build();
        rabbitTemplate.convertAndSend(paymentExchange, paymentBookingStatusKey, event);
        log.info("[PaymentPublisher] → Booking : bookingId={}, paid={}", bookingId, isPaid);
    }

    // ── Vers Match ───────────────────────────────────────────────────────────────

    public void publishToMatch(Long matchId, Long bookingId, Long userId, boolean isPaid, Double amount) {
        MatchPaymentStatusEvent event = MatchPaymentStatusEvent.builder()
                .matchId(matchId)
                .bookingId(bookingId)
                .userId(userId.toString())
                .isPaid(isPaid)
                .failureReason(isPaid ? null : "Carte invalide")
                .amountPaid(BigDecimal.valueOf(amount))
                .processedAt(LocalDateTime.now())
                .build();
        rabbitTemplate.convertAndSend(paymentExchange, paymentMatchStatusKey, event);
        log.info("[PaymentPublisher] → Match : matchId={}, userId={}, paid={}", matchId, userId, isPaid);
    }
}
