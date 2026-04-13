package com.tennis.equipmentservice.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String EQUIPMENT_EVENT_QUEUE = "equipment.event.queue";
    public static final String ADMIN_ALERT_QUEUE = "admin.alert.queue";
    public static final String PAYMENT_EVENT_QUEUE = "payment.event.queue";

    @Bean
    public Queue equipmentEventQueue() {
        return new Queue(EQUIPMENT_EVENT_QUEUE, true);
    }

    // IMPORTANT : sérialise les objets en JSON automatiquement
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }

    @Bean
    public Queue adminAlertQueue() {
        return new Queue(ADMIN_ALERT_QUEUE, true);
    }

    @Bean
    public Queue paymentEventQueue() {
        return new Queue(PAYMENT_EVENT_QUEUE, true);
    }
}