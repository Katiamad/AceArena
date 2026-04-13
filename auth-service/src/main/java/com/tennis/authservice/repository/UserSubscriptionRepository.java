package com.tennis.authservice.repository;

import com.tennis.authservice.modele.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {

    @Query("SELECT us FROM UserSubscription us WHERE us.user.id = :userId AND us.isActive = true")
    Optional<UserSubscription> findActiveByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE UserSubscription us SET us.isActive = false WHERE us.user.id = :userId")
    void deactivateAll(@Param("userId") Long userId);
}