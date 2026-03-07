# API Documentation - BHW Nutrition Tracker

## Base URL
```
http://localhost:3000/api
# Or your production domain
https://yourdomain.com/api
```

## Authentication

### Overview
- All protected endpoints require JWT token stored in `authToken` HTTP-only cookie
- Tokens expire in 1 hour
- Rate limiting: 5 login attempts per 15 minutes

### Login
**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "username": "bhw_worker",
  "password": "SecurePass123!"
}
```

**Success Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "bhw_worker",
    "role": "bhw"
  }
}
```

**Response Headers:**
```
Set-Cookie: authToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
```

**Error Responses:**
```json
// Invalid credentials
{
  "message": "Invalid credentials"
}

// Account deactivated
{
  "message": "Account is deactivated. Contact administrator."
}

// Account locked (too many failed attempts)
{
  "message": "Account locked due to too many failed login attempts. Try again in 30 minutes."
}

// Too many login attempts (rate limit)
{
  "message": "Too many login attempts. Please try again after 15 minutes."
}
```

**Status Codes:**
- `200` - Login successful
- `400` - Missing username or password
- `401` - Invalid credentials
- `403` - Account is deactivated
- `429` - Too many attempts (rate limited or locked)

---

### Logout
**Endpoint:** `POST /auth/logout`

**Headers:** (automatically included from cookie)
```
Cookie: authToken=<jwt>
```

**Success Response:**
```json
{
  "message": "Logout successful"
}
```

**Response Headers:**
```
Set-Cookie: authToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0
```

**Status Code:** `200`

---

### Validate Password Strength
**Endpoint:** `POST /auth/validate-password`

**Request:**
```json
{
  "password": "MySecure123!"
}
```

**Success Response:**
```json
{
  "isValid": true,
  "message": "Password meets security requirements"
}
```

**Error Response:**
```json
{
  "isValid": false,
  "errors": [
    "Password must contain at least one uppercase letter",
    "Password must contain at least one special character (!@#$%^&*...)"
  ]
}
```

**Status Codes:**
- `200` - Password is valid
- `400` - Password does not meet requirements

---

## User Management (Admin Only)

### Create User
**Endpoint:** `POST /users`

**Headers:**
```
Cookie: authToken=<jwt>
Content-Type: application/json
```

**Request:**
```json
{
  "username": "new_bhw",
  "password": "SecurePass123!",
  "role": "bhw"
}
```

**Success Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "username": "new_bhw",
    "role": "bhw",
    "isActive": true,
    "createdAt": "2024-02-28T10:30:00Z"
  }
}
```

**Error Responses:**
```json
// Missing fields
{
  "message": "Username and password are required"
}

// Username too short
{
  "message": "Username must be between 3 and 30 characters"
}

// Invalid username format
{
  "message": "Username can only contain letters, numbers, and underscores"
}

// Username already exists
{
  "message": "Username already exists"
}

// Weak password
{
  "message": "Password does not meet security requirements",
  "errors": [...]
}

// Not authorized
{
  "message": "Forbidden: insufficient permissions"
}
```

**Status Codes:**
- `201` - User created successfully
- `400` - Validation failed
- `401` - Unauthorized
- `403` - Not admin

---

### Get All Users
**Endpoint:** `GET /users`

**Headers:**
```
Cookie: authToken=<jwt>
```

**Success Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "username": "admin_user",
    "role": "admin",
    "isActive": true,
    "lastLogin": "2024-02-28T14:30:00Z",
    "loginAttempts": 0,
    "lockUntil": null,
    "createdAt": "2024-02-20T10:00:00Z",
    "updatedAt": "2024-02-28T14:30:00Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "username": "bhw_worker",
    "role": "bhw",
    "isActive": true,
    "lastLogin": "2024-02-28T12:00:00Z",
    "loginAttempts": 0,
    "lockUntil": null,
    "createdAt": "2024-02-22T09:15:00Z",
    "updatedAt": "2024-02-28T12:00:00Z"
  }
]
```

**Status Code:** `200`

---

### Deactivate User
**Endpoint:** `PATCH /users/:userId/deactivate`

**Headers:**
```
Cookie: authToken=<jwt>
```

**Success Response:**
```json
{
  "message": "User deactivated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "username": "bhw_worker",
    "role": "bhw",
    "isActive": false
  }
}
```

**Status Codes:**
- `200` - User deactivated
- `404` - User not found
- `403` - Not admin

---

### Reactivate User
**Endpoint:** `PATCH /users/:userId/reactivate`

**Headers:**
```
Cookie: authToken=<jwt>
```

**Success Response:**
```json
{
  "message": "User reactivated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "username": "bhw_worker",
    "role": "bhw",
    "isActive": true
  }
}
```

**Status Codes:**
- `200` - User reactivated
- `404` - User not found
- `403` - Not admin

---

### Reset User Password
**Endpoint:** `POST /users/:userId/reset-password`

**Headers:**
```
Cookie: authToken=<jwt>
Content-Type: application/json
```

**Request:**
```json
{
  "newPassword": "NewSecure123!"
}
```

**Success Response:**
```json
{
  "message": "User password reset successfully",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "username": "bhw_worker",
    "isActive": true
  }
}
```

**Error Responses:**
```json
{
  "message": "New password is required"
}

{
  "message": "New password does not meet security requirements",
  "errors": [...]
}

{
  "message": "User not found"
}
```

**Status Codes:**
- `200` - Password reset
- `400` - Validation failed
- `404` - User not found
- `403` - Not admin

---

## Residents

### Get All Residents
**Endpoint:** `GET /residents`

**Headers:**
```
Cookie: authToken=<jwt>
```

**Success Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439021",
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "birthDate": "2015-05-15T00:00:00Z",
    "gender": "Male",
    "age": 9,
    "address": {
      "purok": 1,
      "street": "Main Street"
    },
    "contactNumber": "09123456789",
    "medicalConditions": ["asthma"],
    "createdAt": "2024-02-20T10:00:00Z",
    "updatedAt": "2024-02-28T10:00:00Z"
  }
]
```

**Status Code:** `200`

---

### Add New Resident
**Endpoint:** `POST /residents`

**Headers:**
```
Cookie: authToken=<jwt>
Content-Type: application/json
```

**Request:**
```json
{
  "firstName": "Maria",
  "lastName": "Santos",
  "birthDate": "2016-03-20",
  "gender": "Female",
  "address": {
    "purok": 2,
    "street": "Second Avenue"
  },
  "contactNumber": "09987654321",
  "medicalConditions": []
}
```

**Success Response:**
```json
{
  "_id": "507f1f77bcf86cd799439022",
  "firstName": "Maria",
  "lastName": "Santos",
  "birthDate": "2016-03-20T00:00:00Z",
  "gender": "Female",
  "age": 8,
  "address": {
    "purok": 2,
    "street": "Second Avenue"
  },
  "contactNumber": "09987654321",
  "medicalConditions": [],
  "createdAt": "2024-02-28T10:30:00Z",
  "updatedAt": "2024-02-28T10:30:00Z"
}
```

**Error Response:**
```json
{
  "message": "Validation Failed",
  "error": "Missing required fields: firstName, address.purok"
}
```

**Status Codes:**
- `201` - Resident created
- `400` - Validation failed
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient role)

---

## Nutrition Records

### Add Nutrition Record
**Endpoint:** `POST /nutrition`

**Headers:**
```
Cookie: authToken=<jwt>
Content-Type: application/json
```

**Request:**
```json
{
  "resident": "507f1f77bcf86cd799439021",
  "weight": 25.5,
  "height": 120
}
```

**Success Response:**
```json
{
  "_id": "507f1f77bcf86cd799439031",
  "resident": "507f1f77bcf86cd799439021",
  "weight": 25.5,
  "height": 120,
  "bmi": 17.7,
  "status": "Normal",
  "recordedBy": "507f1f77bcf86cd799439011",
  "createdAt": "2024-02-28T10:35:00Z"
}
```

**Status Code:** `201`

---

## BMI Records

### Get All BMI Records
**Endpoint:** `GET /bmi`

**Headers:**
```
Cookie: authToken=<jwt>
```

**Success Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439041",
    "weight": 25.5,
    "height": 120,
    "bmi": 17.7,
    "category": "Normal",
    "createdAt": "2024-02-28T10:35:00Z"
  }
]
```

**Status Code:** `200`

---

### Create BMI Record
**Endpoint:** `POST /bmi`

**Headers:**
```
Cookie: authToken=<jwt>
Content-Type: application/json
```

**Request:**
```json
{
  "weight": 28,
  "height": 130
}
```

**Success Response:**
```json
{
  "_id": "507f1f77bcf86cd799439042",
  "weight": 28,
  "height": 130,
  "bmi": 16.6,
  "category": "Normal",
  "createdAt": "2024-02-28T10:40:00Z"
}
```

**Status Code:** `201`

---

## Error Handling

### Common Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| `400` | Bad Request | Missing required fields, validation failed |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Server Error | Internal server error |

### Error Response Format
```json
{
  "message": "Description of error",
  "error": "Detailed error message (in development only)"
}
```

---

## Rate Limiting

### Headers in Response
```
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1645000000
```

### Limits by Endpoint
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/login` | 5 attempts | 15 minutes |
| General API | 100 requests | 15 minutes |

---

## Usage Examples

### Example 1: Login and Create User

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "password": "AdminPass123!"
  }'

# Response includes Set-Cookie header with authToken

# 2. Create new BHW user (cookie automatically included)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -b "authToken=<token>" \
  -d '{
    "username": "new_bhw",
    "password": "SecurePass123!",
    "role": "bhw"
  }'

# 3. Logout (cookie automatically included)
curl -X POST http://localhost:3000/api/auth/logout \
  -b "authToken=<token>"
```

### Example 2: Add Resident and Nutrition Record

```bash
# 1. Add resident
curl -X POST http://localhost:3000/api/residents \
  -H "Content-Type: application/json" \
  -b "authToken=<token>" \
  -d '{
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "birthDate": "2015-05-15",
    "gender": "Male",
    "address": {
      "purok": 1,
      "street": "Main Street"
    },
    "contactNumber": "09123456789"
  }'

# 2. Add nutrition record for resident
curl -X POST http://localhost:3000/api/nutrition \
  -H "Content-Type: application/json" \
  -b "authToken=<token>" \
  -d '{
    "resident": "507f1f77bcf86cd799439021",
    "weight": 25.5,
    "height": 120
  }'
```

---

**API Version:** 1.0.0
**Last Updated:** February 28, 2026
