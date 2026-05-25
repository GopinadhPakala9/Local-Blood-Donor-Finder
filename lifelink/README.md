# LifeLink – Blood Donor Finder

> **Connecting Donors, Saving Lives** 🩸

A production-ready full-stack application connecting blood donors, patients, hospitals, and blood banks in real time.

---

## Project Structure

```
lifelink/
├── backend/                    # NestJS REST API
│   ├── src/
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/           # OTP + Google + JWT auth
│   │   │   ├── users/          # User management
│   │   │   ├── donors/         # Donor search (Haversine SQL)
│   │   │   ├── blood-requests/ # Emergency requests + FCM notify
│   │   │   ├── hospitals/      # Hospital management
│   │   │   ├── blood-banks/    # Blood bank + inventory
│   │   │   ├── donations/      # Donation tracking + certificates
│   │   │   ├── rewards/        # Gamification (points + badges)
│   │   │   ├── notifications/  # FCM push notifications
│   │   │   └── admin/          # Admin panel APIs
│   │   ├── database/
│   │   │   ├── entities/       # TypeORM entities
│   │   │   └── migrations/     # 6 database migrations
│   │   ├── common/             # Guards, decorators, filters
│   │   └── config/             # Configuration service
│   ├── Dockerfile
│   └── package.json
│
├── mobile/                     # Flutter App (Android + iOS)
│   ├── lib/
│   │   ├── core/               # Theme, constants, network, utils
│   │   ├── data/               # Remote + local datasources
│   │   ├── domain/             # Entities, repositories, use cases
│   │   └── presentation/       # Screens, widgets, providers, router
│   └── pubspec.yaml
│
├── docker/                     # Docker Compose + Nginx
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── init.sql
│
├── docs/                       # Documentation
│   ├── API.md                  # Full API reference
│   ├── SETUP.md                # Local dev setup
│   └── DEPLOYMENT.md           # AWS production deployment
│
└── .github/
    └── workflows/
        ├── backend-ci.yml      # Backend CI/CD (test + Docker + ECS)
        └── flutter-ci.yml      # Flutter CI/CD (analyze + build AAB/IPA)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | Flutter 3.16, Riverpod, GoRouter, Dio |
| **Backend** | Node.js 18, NestJS 10, TypeORM |
| **Database** | PostgreSQL 15 |
| **Cache / Queue** | Redis 7, Bull |
| **Auth** | Firebase Auth (OTP, Google, Apple) + JWT |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |
| **Maps** | Google Maps Flutter |
| **Infrastructure** | Docker, Nginx, AWS (ECS Fargate + RDS + ElastiCache) |
| **CI/CD** | GitHub Actions |

---

## Quick Start

### Docker (Recommended)
```bash
git clone https://github.com/your-org/lifelink.git
cd lifelink/docker
cp ../.env.example .env
# Edit .env with your Firebase + JWT secrets
docker-compose up -d
```

API: `http://localhost:3000/api/v1`  
Swagger: `http://localhost:3000/api/docs`

### Manual Setup
See [docs/SETUP.md](docs/SETUP.md)

---

## Key Features

- **OTP Phone Login** + Google OAuth
- **Real-time donor search** within radius using Haversine formula SQL
- **Privacy-first**: Exact donor location never exposed; only "2.3 km away"
- **Emergency FCM push notifications** to nearby matching donors instantly
- **Gamification**: Points, Bronze → Silver → Gold → Hero badges, leaderboard
- **Blood bank inventory** management
- **Hospital verification** workflow
- **Donation certificates** (PDF, S3)
- **Offline caching** (Hive)
- **Admin panel** for moderation

---

## Documentation

| Document | Description |
|----------|-------------|
| [API Reference](docs/API.md) | All endpoints with request/response examples |
| [Local Setup](docs/SETUP.md) | Prerequisites, Firebase, Google Maps setup |
| [Deployment](docs/DEPLOYMENT.md) | AWS production deployment guide |

---

## License

MIT License — Free to use and modify.

---

*Built with ❤️ for the LifeLink community*
