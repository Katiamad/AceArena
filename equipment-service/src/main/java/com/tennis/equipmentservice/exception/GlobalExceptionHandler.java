package com.tennis.equipmentservice.exception;

import jakarta.persistence.OptimisticLockException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<?> handleBadRequest(BadRequestException ex) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                "BAD_REQUEST"
        );
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<?> handleNotFound(NotFoundException ex) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage(),
                "NOT_FOUND"
        );
    }

    // 🔥 Gère les deux types d'exception optimistic locking
    @ExceptionHandler({
            OptimisticLockException.class,
            ObjectOptimisticLockingFailureException.class
    })
    public ResponseEntity<?> handleOptimisticLock(Exception ex) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "Concurrent modification detected",
                "CONFLICT"
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex) {
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error",
                "INTERNAL_SERVER_ERROR"
        );
    }

    // 🔥 Méthode utilitaire pour uniformiser la réponse
    private ResponseEntity<?> buildResponse(
            HttpStatus status,
            String message,
            String error
    ) {
        return ResponseEntity.status(status)
                .body(Map.of(
                        "message", message,
                        "error", error,
                        "timestamp", Instant.now().toString()
                ));
    }
}