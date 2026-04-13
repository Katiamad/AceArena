package com.tennis.matchservice.config;

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
public class RabbitMQConfig {

    @Value("${rabbitmq.exchanges.booking-exchange:booking.exchange}")
    private String bookingExchange;
    @Value("${rabbitmq.exchanges.match-exchange:match.exchange}")
    private String matchExchange;
    @Value("${rabbitmq.exchanges.payment-exchange:payment.exchange}")
    private String paymentExchange;

    @Value("${rabbitmq.queues.booking-to-match:booking.match.queue}")
    private String bookingToMatchQueue;
    @Value("${rabbitmq.queues.payment-to-match:payment.match.queue}")
    private String paymentToMatchQueue;

    @Value("${rabbitmq.routing-keys.match-delegate:booking.match.delegate}")
    private String matchDelegateKey;
    @Value("${rabbitmq.routing-keys.match-booking-paid:match.booking.paid}")
    private String matchBookingPaidKey;
    @Value("${rabbitmq.routing-keys.match-payment-request:match.payment.request}")
    private String matchPaymentRequestKey;
    @Value("${rabbitmq.routing-keys.payment-match-status:payment.match.status}")
    private String paymentMatchStatusKey;

    @Bean public TopicExchange bookingExchangeBean() {
        return ExchangeBuilder.topicExchange(bookingExchange).durable(true).build();
    }
    @Bean public TopicExchange matchExchangeBean() {
        return ExchangeBuilder.topicExchange(matchExchange).durable(true).build();
    }
    @Bean public TopicExchange paymentExchangeBean() {
        return ExchangeBuilder.topicExchange(paymentExchange).durable(true).build();
    }

    @Bean public Queue bookingToMatchQueueBean() {
        return QueueBuilder.durable(bookingToMatchQueue).build();
    }
    @Bean public Queue paymentToMatchQueueBean() {
        return QueueBuilder.durable(paymentToMatchQueue).build();
    }

    @Bean public Binding bookingMatchDelegateBinding() {
        return BindingBuilder.bind(bookingToMatchQueueBean()).to(bookingExchangeBean()).with(matchDelegateKey);
    }
    @Bean public Binding paymentMatchStatusBinding() {
        return BindingBuilder.bind(paymentToMatchQueueBean()).to(paymentExchangeBean()).with(paymentMatchStatusKey);
    }

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