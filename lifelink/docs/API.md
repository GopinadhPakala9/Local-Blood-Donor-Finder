# LifeLink API Documentation

**Base URL:** `https://api.lifelink.health/api/v1`  
**Swagger UI:** `https://api.lifelink.health/api/docs`

## Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

All responses follow this envelope:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": { "code": "UNAUTHORIZED", "message": "Invalid or expired token" },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/donors"
}
```

---

## Auth Endpoints

### POST /auth/send-otp
Send OTP to a phone number.

**Request:**
```json
{ "phone": "+919876543210" }
```
**Response:**
```json
{ "success": true, "data": { "message": "OTP sent successfully", "expiresIn": 300 } }
```

---

### POST /auth/verify-otp
Verify OTP and receive JWT tokens.

**Request:**
```json
{ "phone": "+919876543210", "otp": "123456" }
```
**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "phone": "+919876543210",
      "role": "donor",
      "blood_group": "O+",
      "is_verified": false
    }
  }
}
```

---

### POST /auth/google
Login with Firebase Google ID token.

**Request:**
```json
{ "idToken": "firebase-google-id-token" }
```

---

### POST /auth/refresh
Refresh access token.

**Request:**
```json
{ "refreshToken": "eyJ..." }
```

---

## Donor Endpoints

### POST /donors/register 🔒
Register the current user as a blood donor.

**Request:**
```json
{
  "name": "John Doe",
  "blood_group": "O+",
  "gender": "male",
  "dob": "1990-05-15",
  "weight": 72,
  "city": "Mumbai",
  "state": "Maharashtra",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "is_available": true
}
```

---

### GET /donors/search
Search donors with filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| blood_group | string | Filter by blood group (A+, B-, O+, etc.) |
| latitude | float | Requester latitude |
| longitude | float | Requester longitude |
| radius | int | Search radius in km (default: 10) |
| city | string | Filter by city |
| page | int | Page number (default: 1) |
| limit | int | Results per page (default: 20) |

**Response:**
```json
{
  "success": true,
  "data": {
    "donors": [
      {
        "id": "uuid",
        "name": "John D.",
        "blood_group": "O+",
        "city": "Mumbai",
        "state": "Maharashtra",
        "is_available": true,
        "is_verified": true,
        "total_donations": 5,
        "last_donation_date": "2023-10-15",
        "badge": "Silver",
        "distance": "2.3 km"
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 20
  }
}
```

> **Privacy note:** Exact location (lat/lng) is never returned. Only approximate distance (e.g., "2.3 km") is shown.

---

### GET /donors/nearby
Get nearby available donors.

**Query Parameters:** `latitude`, `longitude`, `radius` (km, default 10)

---

### GET /donors/:id
Get a donor's public profile.

**Query Parameters:** `latitude`, `longitude` (optional, for distance calculation)

---

## Blood Request Endpoints

### POST /blood-requests 🔒
Create an emergency blood request. Automatically notifies matching nearby donors via FCM.

**Request:**
```json
{
  "patient_name": "Jane Doe",
  "blood_group": "B+",
  "units_required": 2,
  "hospital_name": "Apollo Hospital, Andheri",
  "contact_number": "+919876543210",
  "required_date": "2024-01-20",
  "urgency": "Urgent",
  "city": "Mumbai",
  "latitude": 19.1136,
  "longitude": 72.8697
}
```

---

### GET /blood-requests
List blood requests with filters.

**Query Parameters:** `blood_group`, `city`, `urgency`, `status` (default: Open), `page`, `limit`

---

### GET /blood-requests/nearby
Get open requests within radius.

**Query Parameters:** `latitude`, `longitude`, `radius` (km, default 20)

---

### PUT /blood-requests/:id 🔒
Update a blood request (owner or admin only).

---

### DELETE /blood-requests/:id 🔒
Cancel a blood request (owner or admin only).

---

## Hospital Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /hospitals | 🔒 | Register hospital |
| GET | /hospitals | - | List hospitals (filter: city, verified) |
| GET | /hospitals/:id | - | Hospital details |
| PUT | /hospitals/:id/verify | 🔒 Admin | Verify hospital |

---

## Blood Bank Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /blood-banks | 🔒 | Register blood bank |
| GET | /blood-banks | - | List with inventory |
| GET | /blood-banks/nearby | - | Nearby banks (lat, lng, radius) |
| GET | /blood-banks/:id | - | Blood bank + full inventory |
| PUT | /blood-banks/:id/inventory | 🔒 | Update stock for a blood group |

**Update Inventory Request:**
```json
{ "blood_group": "O+", "available_units": 12 }
```

---

## Donation Endpoints 🔒

### POST /donations
Log a blood donation.
```json
{ "donated_on": "2024-01-15", "units": 1, "blood_request_id": "uuid-optional" }
```

### GET /donations/my
Get my donation history. Returns list sorted by date descending.

### GET /donations/:id/certificate
Get a PDF certificate URL for a donation.
```json
{ "url": "https://lifelink-certs.s3.ap-south-1.amazonaws.com/cert_uuid.pdf" }
```

---

## Rewards Endpoints

### GET /rewards/my 🔒
Get my total points, badge, and reward history.
```json
{
  "totalPoints": 500,
  "badge": "Silver",
  "donations": 5,
  "history": [
    { "points": 100, "action": "donation", "description": "Donated 1 unit on 2024-01-15", "created_at": "..." }
  ]
}
```

**Badge Levels:**
| Badge | Points Required | Donations |
|-------|----------------|-----------|
| New | 0 | 0 |
| Bronze | 100 | 1 |
| Silver | 500 | 5 |
| Gold | 1000 | 10 |
| Hero | 2000 | 20 |

### GET /rewards/leaderboard
Top 50 donors by points. Public endpoint.

---

## Notification Endpoints 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notifications | Get my notifications (page, limit) |
| PUT | /notifications/:id/read | Mark one as read |
| PUT | /notifications/read-all | Mark all as read |

---

## User Endpoints 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/me | Get my profile |
| PUT | /users/me | Update profile |
| PUT | /users/me/fcm-token | Update push notification token |
| PUT | /users/me/availability | Toggle donor availability |
| GET | /users/me/stats | Get donation stats |

---

## Admin Endpoints 🔒 (Admin role only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/stats | Dashboard stats |
| GET | /admin/users | All users (paginated) |
| PUT | /admin/users/:id/verify | Verify a user |
| PUT | /admin/users/:id/ban | Ban a user |
| GET | /admin/hospitals | Hospitals pending approval |
| PUT | /admin/hospitals/:id/verify | Approve a hospital |

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

## Rate Limits

| Endpoint Group | Limit |
|----------------|-------|
| Auth (/auth/*) | 10 requests/minute |
| All other APIs | 100 requests/minute |
