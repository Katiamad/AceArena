package com.tennis.authservice.repository;


import com.tennis.authservice.modele.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import com.tennis.authservice.modele.Role;
import java.util.List;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Utilisateur> findByRoleIn(List<Role> roles);
}