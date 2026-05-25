# LifeLink – Local Development Setup

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| Flutter | 3.16+ | https://flutter.dev/docs/get-started/install |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| PostgreSQL | 15 | Via Docker (recommended) |
| Redis | 7 | Via Docker (recommended) |
| Git | Latest | https://git-scm.com |

---

## 1. Clone & Setup

```bash
git clone https://github.com/your-org/lifelink.git
cd lifelink
```

---

## 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project: `lifelink-prod`
3. Enable **Authentication** → Sign-in methods:
   - Phone (SMS)
   - Google
   - Apple (for iOS)
4. Go to **Project Settings → Service Accounts** → Generate new private key
5. Save the JSON file — you'll use values in `.env`
6. Enable **Cloud Messaging** (FCM) in Firebase Console

---

## 3. Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API
   - Geocoding API
3. Create API Key with restrictions for your app
4. Add to `mobile/android/app/src/main/AndroidManifest.xml`:
   ```xml
   <meta-data android:name="com.google.android.geo.API_KEY" android:value="YOUR_KEY"/>
   ```
5. Add to `mobile/ios/Runner/AppDelegate.swift`:
   ```swift
   GMSServices.provideAPIKey("YOUR_KEY")
   ```

---

## 4. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your values
# - DATABASE_HOST=localhost
# - JWT_SECRET=your-secret-min-32-chars
# - FIREBASE_* values from service account JSON

# Start PostgreSQL and Redis via Docker
docker run -d --name lifelink-db -e POSTGRES_DB=lifelink -e POSTGRES_USER=lifelink_user -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15-alpine
docker run -d --name lifelink-redis -p 6379:6379 redis:7-alpine

# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev
```

API will be available at: `http://localhost:3000/api/v1`
Swagger docs: `http://localhost:3000/api/docs`

---

## 5. Flutter App Setup

```bash
cd mobile

# Install dependencies
flutter pub get

# Generate code (Freezed, Riverpod, Retrofit)
dart run build_runner build --delete-conflicting-outputs

# Add google-services.json (Android) from Firebase Console
# → mobile/android/app/google-services.json

# Add GoogleService-Info.plist (iOS) from Firebase Console
# → mobile/ios/Runner/GoogleService-Info.plist

# Update API base URL
# Edit: lib/core/constants/app_constants.dart
# Change baseUrl to your backend URL

# Run on Android/iOS simulator
flutter run

# Run on specific device
flutter run -d <device-id>
```

---

## 6. All-in-one with Docker Compose

```bash
cd docker

# Copy and configure environment
cp ../.env.example .env
# Edit .env with all required values

# Start everything
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

---

## 7. Running Tests

```bash
# Backend tests
cd backend
npm test
npm run test:cov   # with coverage

# Flutter tests
cd mobile
flutter test
flutter test --coverage
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `pg_isready` fails | Wait 30s for PostgreSQL to initialize |
| Flutter: `firebase_core` init error | Check google-services.json is in correct location |
| `jwt malformed` | Check JWT_SECRET is set and matches between frontend/backend |
| FCM token not updating | Ensure notification permissions granted on device |
| `No internet connection` | Check DIO_CLIENT baseUrl matches running backend |
| Location not working | Grant location permissions in device settings |
