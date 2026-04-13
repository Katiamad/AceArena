# AceArena — Plateforme de Gestion de Club de Tennis

Projet universitaire d'architecture **microservices** pour la gestion complète d'un club de tennis : réservation de terrains, organisation de matchs (1v1 / 2v2), location d'équipements, paiements et notifications en temps réel.

## Sommaire

- [Architecture](#architecture)
- [Technologies](#technologies)
- [Microservices](#microservices)
- [Fonctionnalités](#fonctionnalités)
- [Communication inter-services](#communication-inter-services)
- [Base de données](#base-de-données)
- [Lancement](#lancement)
- [Ports](#ports)

---

## Architecture

Le projet suit une architecture **microservices event-driven** avec :

- **API Gateway** (Spring Cloud Gateway) comme point d'entrée unique
- **Consul** pour le service discovery
- **RabbitMQ** pour la communication asynchrone entre services (Topic Exchanges)
- **PostgreSQL** partagé (un container, plusieurs bases)
- **JWT (RSA)** pour l'authentification inter-services

```
                        ┌──────────────┐
                        │   Frontend   │
                        │  React/Vite  │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │   Gateway    │
                        │   :8080      │
                        └──────┬───────┘
                               │
          ┌────────┬───────┬───┴───┬─────────┬──────────┐
          │        │       │       │         │          │
     ┌────▼──┐ ┌──▼───┐ ┌─▼──┐ ┌─▼────┐ ┌──▼────┐ ┌──▼─────┐
     │ Auth  │ │Book- │ │Mat-│ │Equip-│ │Notif- │ │Payment │
     │:8081  │ │ing   │ │ch  │ │ment  │ │ication│ │:8086   │
     │ Java  │ │:8082 │ │:8083│ │:8084 │ │:8085  │ │ Java   │
     └───────┘ │ .NET │ │Java│ │ Java │ │ Java  │ └────────┘
               └──┬───┘ └─┬──┘ └──┬───┘ └───▲───┘
                  │       │       │         │
                  └───────┴───────┴─────────┘
                        RabbitMQ (AMQP)
```

## Technologies

| Couche | Stack |
|--------|-------|
| **Frontend** | React 18, TypeScript, Vite, Framer Motion, Lucide Icons |
| **Backend Java** | Java 21, Spring Boot 3.x, Spring Cloud 2025.x, Maven |
| **Backend .NET** | .NET 8, ASP.NET Core Web API |
| **Messaging** | RabbitMQ (Topic Exchanges, Durable Queues) |
| **Base de données** | PostgreSQL 16 (multi-database) |
| **Auth** | JWT RSA (RS256), Spring Security OAuth2 Resource Server |
| **Service Discovery** | HashiCorp Consul |
| **Conteneurisation** | Docker, Docker Compose |

## Microservices

### auth-service (Java/Spring Boot) — `:8081`

Gestion des utilisateurs, authentification et abonnements.

- Inscription / Connexion avec JWT RSA
- Gestion des plans d'abonnement (FREE, PREMIUM, etc.)
- Chaque plan définit : quota de réservations/semaine, accès au mode 2v2, durée
- Endpoint `/api/auth/me/{id}` pour récupérer le profil complet

### booking-service (C#/.NET 8) — `:8082`

Gestion des terrains et des réservations.

- **Admin** : CRUD terrains (nom, surface, prix/heure, localisation, image), gestion des créneaux horaires, génération de créneaux en masse par journée
- **User** : consultation des terrains disponibles, réservation d'un créneau en mode **SIMPLE** (paiement direct) ou **MATCH** (création d'un match partagé)
- Publication d'événements RabbitMQ vers payment-service et match-service
- Consommation des confirmations de paiement pour mettre à jour le statut des réservations

### match-service (Java/Spring Boot) — `:8083`

Organisation de matchs entre joueurs.

- Création de match (1v1 ou 2v2) à partir d'une réservation
- Division automatique du prix : `totalCourtPrice / maxPlayers`
- Système de participants avec suivi de paiement individuel (`hasPaid`)
- Cycle de vie : `OPEN` → `FULL` → `COMPLETED` (quand tous ont payé) / `CANCELLED`
- Notifications enrichies envoyées à **tous** les participants (nom du joueur, terrain, créneau)
- Le créateur et les joueurs qui rejoignent sont redirigés vers le paiement obligatoire

### equipment-service (Java/Spring Boot) — `:8084`

Location d'équipements sportifs.

- Catalogue d'équipements par catégorie (Raquette, Balle, Machine) avec gestion de stock
- Système de location : création, paiement, retour, annulation
- Alertes automatiques de stock bas pour les administrateurs
- Publication d'événement `EQUIPMENT_PAID` après confirmation de paiement

### notification-service (Java/Spring Boot) — `:8085`

Centralisation et persistance des notifications.

- Consomme les événements de tous les services (match, booking, equipment)
- Types de notifications : `MATCH_CREATED`, `PLAYER_JOINED_MATCH`, `MATCH_FULL`, `MATCH_COMPLETED`, `BOOKING_CONFIRMED`, `EQUIPMENT_PAID`, `LOW_STOCK_ALERT`, etc.
- API REST : récupération par utilisateur, marquage comme lu
- Polling frontend toutes les 5 secondes pour un affichage quasi temps réel

### payment-service (Java/Spring Boot) — `:8086`

Traitement des paiements pour tous les services.

- Paiement par carte avec validation Luhn
- Trois types de paiement : `BOOKING`, `MATCH`, `EQUIPMENT`
- Routage automatique des résultats vers le bon service (booking, match, ou equipment)
- Publication de `MatchPaymentStatusEvent` / `BookingPaymentStatusEvent` / `PaymentEvent` via RabbitMQ

## Fonctionnalités

### Réservation de terrain
1. L'utilisateur consulte les terrains disponibles et leurs créneaux libres
2. Il choisit un créneau et le mode : **Solo/Duo** (paiement immédiat) ou **Match** (partage du coût)
3. En mode Solo/Duo : redirection vers la page de paiement, puis confirmation
4. En mode Match : création d'un match, l'utilisateur paie sa part

### Organisation de matchs
1. Le créateur choisit le type (1v1 ou 2v2) et paie sa part du terrain
2. Le match apparaît dans "Matchs disponibles" pour les autres joueurs
3. Chaque joueur qui rejoint est redirigé vers le paiement de sa part
4. Les participants voient qui a rejoint et qui a payé (badges visuels)
5. Quand tous les joueurs ont payé → match `COMPLETED`, réservation confirmée
6. Notifications envoyées à tous les participants à chaque étape

### Location d'équipements
1. L'utilisateur parcourt le catalogue et ajoute des articles au panier
2. Il valide la location et procède au paiement
3. Le statut passe à `PAID` après confirmation
4. L'administrateur peut gérer le stock et reçoit des alertes de stock bas

### Gestion des abonnements
1. Depuis "Mon compte", l'utilisateur voit son plan actif et ses avantages
2. Il peut activer/changer de plan parmi les options disponibles
3. Le plan détermine le quota de réservations et l'accès au mode 2v2

## Communication inter-services

### Exchanges RabbitMQ (Topic)

| Exchange | Description |
|----------|-------------|
| `booking.exchange` | Booking publie vers Payment et Match |
| `payment.exchange` | Payment publie les résultats vers Booking et Match |
| `match.exchange` | Match publie vers Booking (confirmation finale) |

### Flux principaux

**Réservation simple :**
```
Booking → [booking.payment.request] → Payment
Payment → [payment.booking.status] → Booking (CONFIRMED/CANCELLED)
Booking → [booking.event.queue] → Notification
```

**Réservation en mode match :**
```
Frontend → POST /match/api/matchs/initiate → Match créé (OPEN)
Frontend → POST /payment/api/payments → Paiement du créateur
Joueur rejoint → POST /match/{id}/join → Frontend → Paiement
Payment → [payment.match.status] → Match (hasPaid=true par joueur)
Tous payé → Match COMPLETED → [match.booking.paid] → Booking CONFIRMED
Chaque étape → [match.event.queue] → Notification
```

**Location d'équipement :**
```
Frontend → POST /payment/api/payments → Payment
Payment → [payment.event.queue] → Equipment (status=PAID)
Equipment → [equipment.event.queue] → Notification
```

## Base de données

Un seul container PostgreSQL avec plusieurs bases :

| Base | Service | Contenu |
|------|---------|---------|
| `auth_db` | auth-service | Utilisateurs, abonnements, plans |
| `booking_db` | booking-service | Terrains, créneaux, réservations |
| `match_db` | match-service | Matchs, participants |
| `equipment_db` | equipment-service | Equipements, locations |
| `notification_db` | notification-service | Notifications |
| `payment_db` | payment-service | Paiements |

## Lancement

### Pré-requis
- Docker et Docker Compose installés

### Commandes

```bash
# Build et démarrage complet
docker compose up -d --build

# Vérifier que tout tourne
docker ps

# Stopper le projet
docker compose down

# Reset complet (supprime les volumes/données)
docker compose down -v
```

### Vérification PostgreSQL

```bash
docker exec -it postgres psql -U postgres
\l          # lister les bases
\c auth_db  # se connecter à une base
\dt         # lister les tables
```

## Ports

| Service | Port | Techno |
|---------|------|--------|
| Gateway | 8080 | Spring Cloud Gateway |
| auth-service | 8081 | Java / Spring Boot |
| booking-service | 8082 | C# / .NET 8 |
| match-service | 8083 | Java / Spring Boot |
| equipment-service | 8084 | Java / Spring Boot |
| notification-service | 8085 | Java / Spring Boot |
| payment-service | 8086 | Java / Spring Boot |
| Frontend (dev) | 5173 | React / Vite |
| PostgreSQL | 5432 | PostgreSQL 16 |
| Consul | 8500 | HashiCorp Consul |
| RabbitMQ | 5672 / 15672 | RabbitMQ (AMQP / Management UI) |

## Frontend

Application React SPA avec :

- **Accueil** : affichage dynamique des terrains disponibles avec stats en temps réel
- **Réservation** : sélection de terrain, créneau, mode (Solo/Match), paiement
- **Matchs** : liste des matchs ouverts, rejoindre & payer, suivi des participants
- **Locations** : catalogue d'équipements, location, paiement, historique
- **Mon compte** : profil, gestion d'abonnement avec cartes de plans, navigation rapide
- **Admin** : gestion des terrains (CRUD), créneaux, gestion des équipements et stock
- **Notifications** : cloche avec badge, polling 5s, marquage comme lu

---

**Projet universitaire — Architecture Microservices & Interopérabilité**
