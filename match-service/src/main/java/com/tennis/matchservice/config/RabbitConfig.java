package com.tennis.matchservice.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    // Doit correspondre a ce que notification-service ecoute
    public static final String MATCH_EVENT_QUEUE = "match.event.queue";

    @Bean
    public Queue matchEventQueue() {
        return new Queue(MATCH_EVENT_QUEUE, true);
    }
}
