package com.tennis.authservice.modele;

import com.tennis.authservice.repository.SubscriptionRepository;
import com.tennis.authservice.repository.UserSubscriptionRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Component
public class FacadeAbonnements {

    private final SubscriptionRepository subRepo;
    private final UserSubscriptionRepository usRepo;

    public FacadeAbonnements(SubscriptionRepository subRepo, UserSubscriptionRepository usRepo) {
        this.subRepo = subRepo;
        this.usRepo = usRepo;
    }

    // crée le plan FREE en DB si absent
    @Transactional
    public Subscription ensureFreePlan() {
        return subRepo.findByCode("FREE").orElseGet(() -> subRepo.save(Subscription.planFree()));
    }

    @Transactional
    public UserSubscription souscrire(Utilisateur user, Subscription plan) {
        usRepo.deactivateAll(user.getId());

        OffsetDateTime start = OffsetDateTime.now();
        OffsetDateTime end = start.plusDays(plan.getDurationDays());

        UserSubscription us = UserSubscription.builder()
                .user(user)
                .subscription(plan)
                .startDate(start)
                .endDate(end)
                .isActive(true)
                .build();

        return usRepo.save(us);
    }

    public UserSubscription getActif(Long userId) {
        return usRepo.findActiveByUserId(userId).orElse(null);
    }

    public boolean abonnementValide(UserSubscription us) {
        return us != null && OffsetDateTime.now().isBefore(us.getEndDate());
    }
}