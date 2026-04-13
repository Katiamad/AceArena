package com.tennis.equipmentservice.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

@Component
public class BookingClient {

    private final RestTemplate restTemplate;

    public BookingClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean bookingExists(Long bookingId) {

        try {

            String url = "http://booking-service:8082/api/bookings/" + bookingId;

            ResponseEntity<Object> response =
                    restTemplate.getForEntity(url, Object.class);

            return response.getStatusCode().is2xxSuccessful();

        } catch (Exception e) {

            return false;

        }
    }
}