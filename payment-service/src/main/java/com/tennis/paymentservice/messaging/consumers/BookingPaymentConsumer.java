package com.tennis.paymentservice.messaging.consumers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tennis.paymentservice.messaging.events.PaymentStatusEvent;
import com.tennis.paymentservice.messaging.publishers.PaymentEventPublisherb;
import com.tennis.paymentservice.model.Payment;
import com.tennis.paymentservice.model.PaymentStatus;
import com.tennis.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingPaymentConsumer {

    private final PaymentRepository paymentRepository;
    private final PaymentEventPublisherb publisher;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @RabbitListener(queues = "${rabbitmq.queues.booking-to-payment:booking.to.payment.queue}")
    public void handleBookingPaymentRequest(Message message) {
        String body = new String(message.getBody());
        log.info("[PaymentConsumer] Message brut reçu : {}", body);

        try {
            JsonNode json = objectMapper.readTree(body);

            Long bookingId = json.hasNonNull("BookingId") ? json.get("BookingId").asLong() : null;
            String userId = json.hasNonNull("UserId") ? json.get("UserId").asText() : "0";
            BigDecimal totalPrice = json.hasNonNull("TotalPrice")
                    ? new BigDecimal(json.get("TotalPrice").asText())
                    : BigDecimal.ZERO;



            log.info("[PaymentConsumer] Parsé → bookingId={}, userId={}, montant={}", bookingId, userId, totalPrice);

            if (bookingId == null) {
                log.error("[PaymentConsumer] bookingId null, message ignoré. Body={}", body);
                return;
            }

            if (paymentRepository.existsByBookingIdAndStatusNot(bookingId, PaymentStatus.FAILED)) {
                log.warn("[PaymentConsumer] Déjà traité pour bookingId={}", bookingId);
                return;
            }

            Payment payment = new Payment();
            payment.setBookingId(bookingId);
            payment.setUserId(userId != null ? Long.parseLong(userId) : 0L);
            payment.setAmount(totalPrice.doubleValue());
            payment.setCurrency("EUR");
            payment.setPaymentMethod("AUTO");
            payment.setStatus(PaymentStatus.PENDING);
            payment.setCreatedAt(LocalDateTime.now());
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            boolean isPaid = totalPrice.compareTo(BigDecimal.ZERO) > 0;
            payment.setStatus(isPaid ? PaymentStatus.PAID : PaymentStatus.FAILED);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            publisher.publishBookingPaymentStatus(PaymentStatusEvent.builder()
                    .bookingId(bookingId)
                    .userId(userId)
                    .isPaid(isPaid)
                    .failureReason(isPaid ? null : "Montant invalide")
                    .amountPaid(isPaid ? totalPrice : BigDecimal.ZERO)
                    .processedAt(LocalDateTime.now())
                    .build());

            log.info("[PaymentConsumer] bookingId={} → {}", bookingId, isPaid ? "PAID ✅" : "FAILED ❌");

        } catch (Exception e) {
            log.error("[PaymentConsumer] Erreur parsing message : {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }
}
