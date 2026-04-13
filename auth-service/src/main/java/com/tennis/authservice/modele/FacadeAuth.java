package com.tennis.authservice.modele;

import com.tennis.authservice.modele.exceptions.LoginDejaUtiliseException;
import com.tennis.authservice.modele.exceptions.UtilisateurInexistantException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.tennis.authservice.repository.SubscriptionRepository;
import com.tennis.authservice.repository.UtilisateurRepository;


import java.util.List;
import java.util.function.Function;

@Component
public class FacadeAuth {

    private final FacadeUtilisateurs users;
    private final FacadeAbonnements abonnements;
    private final Function<Utilisateur, String> genereTokenFunction;
    private final SubscriptionRepository subscriptionRepository;
    private final UtilisateurRepository utilisateurRepository;

    public FacadeAuth(
            FacadeUtilisateurs users,
            FacadeAbonnements abonnements,
            Function<Utilisateur, String> genereTokenFunction,
            SubscriptionRepository subscriptionRepository,
            UtilisateurRepository utilisateurRepository) {

        this.users = users;
        this.abonnements = abonnements;
        this.genereTokenFunction = genereTokenFunction;
        this.subscriptionRepository = subscriptionRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Transactional
    public Utilisateur register(
            String email,
            String password,
            String firstName,
            String lastName)
            throws LoginDejaUtiliseException {

        Utilisateur u = users.inscrireUtilisateur(email, password, firstName, lastName);

        Subscription free = abonnements.ensureFreePlan();
        abonnements.souscrire(u, free);

        return u;
    }

    @Transactional
    public Utilisateur login(String email, String password)
            throws UtilisateurInexistantException {

        Utilisateur u = users.verifierLogin(email, password);

        Subscription free = abonnements.ensureFreePlan();
        UserSubscription us = abonnements.getActif(u.getId());

        if (us == null || !abonnements.abonnementValide(us)) {
            abonnements.souscrire(u, free);
        }

        return u;
    }

    public String tokenForUser(Utilisateur u) {

        return genereTokenFunction.apply(u);

    }
    public Utilisateur getById(Long id) throws UtilisateurInexistantException {
        return utilisateurRepository.findById(id)
                .orElseThrow(UtilisateurInexistantException::new);
    }

    public List<Subscription> getAllPlans() {
        return subscriptionRepository.findAll();
    }

    @Transactional
    public UserSubscription subscribeA(Long userId, String planCode) throws Exception {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(UtilisateurInexistantException::new);
        Subscription plan = subscriptionRepository.findByCode(planCode)
                .orElseThrow(() -> new Exception("Plan introuvable : " + planCode));
        return abonnements.souscrire(user, plan);
    }



    public List<Long> getAdminAndManagerIds() {
        return utilisateurRepository.findByRoleIn(
                        List.of(Role.ROLE_ADMIN, Role.ROLE_MANAGER)
                ).stream()
                .map(Utilisateur::getId)
                .toList();
    }
    @Transactional
    public Utilisateur updateProfile(Long id, String email, String firstName, String lastName)
            throws UtilisateurInexistantException, LoginDejaUtiliseException {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(UtilisateurInexistantException::new);

        if (email != null && !email.equals(user.getEmail())) {
            if (utilisateurRepository.findByEmail(email).isPresent()) {
                throw new LoginDejaUtiliseException();
            }
            user.setEmail(email);
        }
        if (firstName != null) user.setFirstName(firstName);
        if (lastName != null)  user.setLastName(lastName);

        return utilisateurRepository.save(user);
    }

    @Transactional
    public void changePassword(Long id, String currentPassword, String newPassword)
            throws UtilisateurInexistantException {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(UtilisateurInexistantException::new);

        // Vérifie l'ancien mot de passe via le login existant
        users.verifierLogin(user.getEmail(), currentPassword); // lève une exception si incorrect

        users.updatePassword(user, newPassword);
    }

}