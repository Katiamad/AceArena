package com.tennis.paymentservice.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PaymentRabbitMQConfig {

    // ── Exchanges ────────────────────────────────────────────────────────────────
    @Value("${rabbitmq.exchanges.booking-exchange:booking.exchange}")
    private String bookingExchange;
    @Value("${rabbitmq.exchanges.match-exchange:match.exchange}")
    private String matchExchange;
    @Value("${rabbitmq.exchanges.payment-exchange:payment.exchange}")
    private String paymentExchange;

    // ── Queues consommées PAR payment-service (incoming) ─────────────────────────
    @Value("${rabbitmq.queues.booking-to-payment:booking.to.payment.queue}")
    private String bookingToPaymentQueue;
    @Value("${rabbitmq.queues.match-to-payment:match.payment.queue}")
    private String matchToPaymentQueue;

    // ── Queues de publication DEPUIS payment-service (outgoing) ──────────────────
    public static final String PAYMENT_EVENT_QUEUE = "payment.event.queue";

    @Value("${rabbitmq.queues.payment-to-booking:payment.to.booking.queue}")
    private String paymentToBookingQueue;

    // ── Routing keys (incoming) ─────────────────────────────────────────────────
    @Value("${rabbitmq.routing-keys.payment-request:booking.payment.request}")
    private String bookingPaymentRequestKey;
    @Value("${rabbitmq.routing-keys.match-payment-request:match.payment.request}")
    private String matchPaymentRequestKey;

    // ── Routing keys (outgoing) ─────────────────────────────────────────────────
    @Value("${rabbitmq.routing-keys.payment-booking-status:payment.booking.status}")
    private String paymentBookingStatusKey;
    @Value("${rabbitmq.routing-keys.payment-match-status:payment.match.status}")
    private String paymentMatchStatusKey;

    // ── Exchanges ────────────────────────────────────────────────────────────────
    @Bean public TopicExchange bookingExchangeBean() {
        return ExchangeBuilder.topicExchange(bookingExchange).durable(true).build();
    }
    @Bean public TopicExchange matchExchangeBean() {
        return ExchangeBuilder.topicExchange(matchExchange).durable(true).build();
    }
    @Bean public TopicExchange paymentExchangeBean() {
        return ExchangeBuilder.topicExchange(paymentExchange).durable(true).build();
    }

    // ── Queues (incoming) ────────────────────────────────────────────────────────
    @Bean public Queue bookingToPaymentQueueBean() {
        return QueueBuilder.durable(bookingToPaymentQueue).build();
    }
    @Bean public Queue matchToPaymentQueueBean() {
        return QueueBuilder.durable(matchToPaymentQueue).build();
    }

    // ── Queues (outgoing) ────────────────────────────────────────────────────────
    @Bean public Queue paymentEventQueue() {
        return QueueBuilder.durable(PAYMENT_EVENT_QUEUE).build();
    }
    @Bean public Queue paymentToBookingQueueBean() {
        return QueueBuilder.durable(paymentToBookingQueue).build();
    }

    // ── Bindings (incoming : booking/match → payment) ────────────────────────────
    @Bean public Binding bookingPaymentBinding() {
        return BindingBuilder.bind(bookingToPaymentQueueBean()).to(bookingExchangeBean()).with(bookingPaymentRequestKey);
    }
    @Bean public Binding matchPaymentBinding() {
        return BindingBuilder.bind(matchToPaymentQueueBean()).to(matchExchangeBean()).with(matchPaymentRequestKey);
    }

    // ── Bindings (outgoing : payment → booking/match) ────────────────────────────
    @Bean public Binding paymentToBookingBinding() {
        return BindingBuilder.bind(paymentToBookingQueueBean()).to(paymentExchangeBean()).with(paymentBookingStatusKey);
    }

    // ── Converter & Template ─────────────────────────────────────────────────────
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(mapper);
        converter.setAlwaysConvertToInferredType(true);
        return converter;
    }

    @Bean public RabbitTemplate rabbitTemplate(ConnectionFactory cf) {
        RabbitTemplate t = new RabbitTemplate(cf);
        t.setMessageConverter(messageConverter());
        return t;
    }
}
