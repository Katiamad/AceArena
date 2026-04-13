package com.tennis.authservice.modele;

import com.tennis.authservice.modele.exceptions.LoginDejaUtiliseException;
import com.tennis.authservice.modele.exceptions.UtilisateurInexistantException;
import com.tennis.authservice.repository.UtilisateurRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Component
public class FacadeUtilisateurs {

    private final UtilisateurRepository repo;
    private final PasswordEncoder encoder;

    public FacadeUtilisateurs(UtilisateurRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    private Role getRoleFromEmail(String email) {
        String domain = email.split("@")[1];
        return switch (domain) {
            case "admin.tennis.com" -> Role.ROLE_ADMIN;
            case "manager.tennis.com" -> Role.ROLE_MANAGER;
            default -> Role.ROLE_USER;
        };
    }

    public Utilisateur inscrireUtilisateur(String email, String password, String firstName, String lastName)
            throws LoginDejaUtiliseException {

        if (repo.existsByEmail(email)) throw new LoginDejaUtiliseException();

        Utilisateur u = Utilisateur.builder()
                .email(email.toLowerCase())
                .password(encoder.encode(password))
                .role(getRoleFromEmail(email))
                .firstName(firstName)
                .lastName(lastName)
                .createdAt(OffsetDateTime.now())
                .build();

        return repo.save(u);
    }

    public Utilisateur getUtilisateurByEmail(String email) throws UtilisateurInexistantException {
        return repo.findByEmail(email.toLowerCase())
                .orElseThrow(UtilisateurInexistantException::new);
    }

    public Utilisateur verifierLogin(String email, String password) throws UtilisateurInexistantException {
        Utilisateur u = getUtilisateurByEmail(email);
        if (!encoder.matches(password, u.getPassword())) throw new UtilisateurInexistantException();
        return u;
    }
    @Transactional
    public void updatePassword(Utilisateur user, String newPassword) {
        user.setPassword(encoder.encode(newPassword));
        repo.save(user);
    }
}