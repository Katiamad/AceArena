package com.tennis.notificationservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "auth-service", url = "http://auth-service:8081")
public interface AuthClient {

    @GetMapping("/api/auth/admins")
    List<Long> getAdminAndManagerIds();
}