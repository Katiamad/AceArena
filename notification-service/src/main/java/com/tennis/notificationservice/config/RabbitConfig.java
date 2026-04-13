package com.tennis.notificationservice.config;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import org.springframework.amqp.core.Queue;

import java.util.Map;

@Configuration
public class RabbitConfig {

    public static final String MATCH_EVENT_QUEUE = "match.event.queue";
    public static final String EQUIPMENT_EVENT_QUEUE = "equipment.event.queue";
    public static final String ADMIN_ALERT_QUEUE = "admin.alert.queue";
    public static final String BOOKING_EVENT_QUEUE = "booking.event.queue";

    @Bean
    public Queue matchEventQueue() {
        return new Queue(MATCH_EVENT_QUEUE, true);
    }

    @Bean
    public Queue equipmentEventQueue() {
        return new Queue(EQUIPMENT_EVENT_QUEUE, true);
    }

    @Bean
    public Queue adminAlertQueue() {
        return new Queue(ADMIN_ALERT_QUEUE, true);
    }

    @Bean
    public Queue bookingEventQueue() {
        return new Queue(BOOKING_EVENT_QUEUE, true);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(mapper);

        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();

        typeMapper.setIdClassMapping(Map.of(
                "com.tennis.equipmentservice.events.EquipmentEvent",
                com.tennis.notificationservice.evenements.EquipmentEvent.class,
                "com.tennis.equipmentservice.events.AdminAlertEvent",
                com.tennis.notificationservice.evenements.AdminAlertEvent.class,
                "com.tennis.matchservice.evenements.MatchEvent",
                com.tennis.notificationservice.evenements.MatchEvent.class
        ));

        typeMapper.setTypePrecedence(DefaultJackson2JavaTypeMapper.TypePrecedence.INFERRED);
        converter.setJavaTypeMapper(typeMapper);

        return converter;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
