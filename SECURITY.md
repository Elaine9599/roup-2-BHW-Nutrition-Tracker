# Security Implementation Guide

## Overview

This document outlines the comprehensive security measures implemented in the BHW Nutrition Tracker backend to protect sensitive barangay health and child nutrition records.

---

## 1. Authentication & Authorization

### 1.1 JWT-Based Authentication
- **Token Storage**: JWT tokens are stored in **HTTP-only, Secure, SameSite=Strict cookies**
  - Prevents XSS attacks from stealing tokens
  - Prevents CSRF attacks with SameSite flag
  - Automatically sent with credentials: true requests
  
- **Token Expiry**: 1 hour (short-lived for security)
  - Reduces damage window if token is compromised
  - Users re-authenticate regularly
  
- **Token Payload**:
  ```json
  {
    "id": "user_id",
    "username": "username",
    "role": "bhw|admin"
  }
  ```

### 1.2 Role-Based Access Control (RBAC)
- **Admin Role**: Can create users, deactivate accounts, reset passwords, view all records
- **BHW Role**: Can access and update health records, view residents, limited access

### 1.3 No Public Registration
- ❌ Public `/register` endpoint removed
- ✅ Only admins can create new BHW user accounts via `/api/users` (POST)
- Prevents unauthorized account creation

---

## 2. Password Security

### 2.1 Strong Password Policy
All passwords must meet these requirements:
- ✓ Minimum 8 characters
- ✓ At least 1 uppercase letter (A-Z)
- ✓ At least 1 lowercase letter (a-z)
- ✓ At least 1 number (0-9)
- ✓ At least 1 special character (!@#$%...)

### 2.2 Password Hashing
- **Algorithm**: bcrypt with **12 salt rounds** (industry standard is 10+)
- **Never stored/returned**: Passwords are NEVER returned in API responses
- **Secure hashing**: Even with database breach, passwords cannot be recovered

### 2.3 Password Reset Flow
- Only admins can reset user passwords (POST `/api/users/:userId/reset-password`)
- New password must meet strong policy requirements
- Resets login attempts and unlock time

---

## 3. Account Lockout & Rate Limiting

### 3.1 Account Lockout
- **Failed Login Attempts**: Account locks after 5 failed attempts
- **Lock Duration**: 30 minutes
- **Reset**: Successful login resets attempts to 0
- **Admin Override**: Admins can unlock via reactivation endpoint

### 3.2 Rate Limiting
- **Login Endpoint**: 5 attempts per 15 minutes (per username)
- **General API**: 100 requests per 15 minutes (per IP)
- **Strict Operations**: 3 requests per 1 minute for sensitive operations

### 3.3 Rate Limiter Headers
```
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1645000000
```

---

## 4. Account Management

### 4.1 Account Activation Control
- ✓ `isActive` field controls whether user can log in
- ✓ Inactive users receive 401 error with custom message
- ✓ Admins can deactivate/reactivate users without deletion (data preservation)
- ✓ Failed login attempts and locks are reset on reactivation

### 4.2 Account Status Tracking
- `createdBy`: References which admin created the account
- `lastLogin`: Timestamp of last successful login
- `loginAttempts`: Counter of failed login attempts
- `lockUntil`: Timestamp when account is unlocked

### 4.3 User Management Endpoints
```
POST   /api/users                      → Create new user (admin only)
GET    /api/users                      → List all users (admin only)
PATCH  /api/users/:userId/deactivate   → Deactivate user (admin only)
PATCH  /api/users/:userId/reactivate   → Reactivate user (admin only)
POST   /api/users/:userId/reset-password → Reset password (admin only)
```

---

## 5. Activity Logging & Audit Trails

### 5.1 Logged Actions
All sensitive operations are logged:
- **Authentication**: LOGIN, LOGOUT
- **User Management**: CREATE_USER, UPDATE_USER
- **Resident Data**: CREATE_RESIDENT, UPDATE_RESIDENT, DELETE_RESIDENT
- **Health Records**: CREATE_NUTRITION, UPDATE_NUTRITION, CREATE_BMI, UPDATE_BMI
- **Immunization**: CREATE_IMMUNIZATION, UPDATE_IMMUNIZATION, DELETE_IMMUNIZATION
- **Inventory**: CREATE_INVENTORY, UPDATE_INVENTORY, DELETE_INVENTORY
- **Reports**: CREATE_REPORT, VIEW_REPORT

### 5.2 Log Contents
Each log entry contains:
- `userId`: Who performed the action
- `action`: Type of action
- `resourceType`: Type of resource affected
- `resourceId`: ID of resource affected
- `changes`: Details of what changed
- `ipAddress`: IP address of request
- `userAgent`: Browser/client information
- `timestamp`: When action occurred

### 5.3 Accessing Activity Logs
**Endpoint** (future implementation):
```
GET /api/audit-logs?userId=xxx&action=xxx&limit=50&skip=0
```

---

## 6. Input Validation & Sanitization

### 6.1 Username Validation
- ✓ Length: 3-30 characters
- ✓ Allowed characters: letters, numbers, underscore only
- ✓ Unique constraint at database level
- ✓ Trimmed of whitespace

### 6.2 Password Validation
- ✓ All inputs validated for strong password policy
- ✓ Endpoint: POST `/api/auth/validate-password`

### 6.3 Request Size Limits
- JSON body limit: 10MB
- URL-encoded body limit: 10MB
- Prevents large payload attacks

---

## 7. CORS & Security Headers

### 7.1 CORS Configuration
```javascript
{
  origin: process.env.FRONTEND_URL,        // Only your frontend
  credentials: true,                        // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```
- Restricts requests to your frontend domain only
- Prevents cross-origin attacks

### 7.2 Security Headers (Helmet.js)
| Header | Purpose |
|--------|---------|
| `Strict-Transport-Security` | Forces HTTPS (1 year, includes subdomains) |
| `Content-Security-Policy` | Restricts script execution to same-origin |
| `X-Content-Type-Options` | Prevents MIME type sniffing |
| `X-Frame-Options` | Prevents clickjacking |
| `X-XSS-Protection` | XSS protection for older browsers |

---

## 8. HTTPS & Transport Security

### 8.1 HTTPS Enforcement
- ✓ **Production**: HTTPS required (automatic with NODE_ENV=production)
- ✓ **Cookies**: Secure flag enabled in production
- ✓ **HSTS**: 1 year with preload

### 8.2 Cookie Security Flags
```javascript
{
  httpOnly: true,          // Not accessible via JavaScript
  secure: true,            // HTTPS only in production
  sameSite: 'Strict',      // CSRF protection
  maxAge: 3600000          // 1 hour
}
```

---

## 9. Data Privacy & Response Sanitization

### 9.1 Sensitive Fields Never Returned
- ❌ Passwords - never returned in API responses
- ❌ Login attempts - hidden from users
- ❌ Lock timestamps - hidden except in error messages

### 9.2 User Response Format
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "bhw_worker",
  "role": "bhw",
  "isActive": true,
  "lastLogin": "2024-02-28T10:30:00Z",
  "createdAt": "2024-02-20T14:22:00Z"
}
```

### 9.3 No Error Details in Production
- Development: Detailed error messages for debugging
- Production: Generic error messages to avoid information leakage

---

## 10. Initial Setup Process

### 10.1 Database Setup
1. Start MongoDB
2. Set up `.env` file from `.env.example`
3. Run setup script: `npm run setup`
4. Interactive script creates first admin user

### 10.2 Setup Flow
```bash
npm run setup
# Enter admin username (3-30 chars, alphanumeric + underscore)
# Enter admin password (must meet strong policy)
# Confirm password
✓ Admin user created
```

### 10.3 First Login
```bash
POST /api/auth/login
{
  "username": "admin_username",
  "password": "admin_password"
}

Response:
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "username": "admin_username",
    "role": "admin"
  }
}

# Token stored in authToken cookie (httpOnly)
```

---

## 11. Environment Configuration

### 11.1 Required Environment Variables
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=<strong-random-key>
FRONTEND_URL=https://yourdomain.com
HTTPS_ENABLED=true
```

### 11.2 JWT Secret Generation
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 12. Deployment Checklist

- [ ] Generate strong JWT secret
- [ ] Set NODE_ENV=production in deployment
- [ ] Enable HTTPS with valid certificate
- [ ] Set HTTPS_ENABLED=true
- [ ] Configure FRONTEND_URL to your domain
- [ ] Set MongoDB URI to production database
- [ ] Use environment variables (not .env file) in production
- [ ] Run `npm run setup` to create admin user
- [ ] Test login flow
- [ ] Enable database backups
- [ ] Set up monitoring/alerting
- [ ] Review audit logs regularly
- [ ] Implement request logging
- [ ] Test CORS restrictions
- [ ] Verify security headers

---

## 13. Compliance & Privacy

### 13.1 Data Protection
- ✓ Encrypted passwords with bcrypt
- ✓ HTTPS transport encryption
- ✓ Request validation prevents injection attacks
- ✓ No sensitive data in logs (except for audit trails with PII consent)
- ✓ Activity logging for compliance audits

### 13.2 Health Data Handling
Since this system handles barangay health records:
- ✓ Restrict access to authorized BHW workers only
- ✓ Maintain audit trails of all data access
- ✓ Use HTTPS for all communications
- ✓ Keep system behind firewall
- ✓ Regular security updates
- ✓ Database backups with encryption

---

## 14. Common Security Mistakes to Avoid

❌ **DON'T**:
- Store passwords in plaintext
- Return passwords in API responses
- Use weak passwords
- Disable HTTPS in production
- Store JWT in localStorage
- Share environment variables
- Hardcode secrets in code
- Skip validation/sanitization
- Use old dependencies with known vulnerabilities

✅ **DO**:
- Use bcrypt for password hashing
- Sanitize all inputs
- Use HTTP-only cookies for JWT storage
- Enable HTTPS in production
- Run `npm audit` regularly
- Keep dependencies updated
- Use environment variables for secrets
- Log security events
- Review audit trails regularly
- Test after security updates

---

## 15. Security Updates & Maintenance

### 15.1 Dependency Updates
```bash
npm outdated              # Check for outdated packages
npm audit                 # Check for vulnerabilities
npm audit fix             # Auto-fix vulnerabilities
npm update                # Update packages
```

### 15.2 Regular Reviews
- Check security headers monthly
- Review audit logs weekly
- Update security patches immediately
- Rotate JWT secrets quarterly
- Review CORS settings quarterly
- Test access controls monthly

---

## 16. Support & Reporting

### Security Issues
If you discover a security vulnerability:
1. **DO NOT** create a public GitHub issue
2. Report privately to the development team
3. Include proof of concept if possible
4. Allow reasonable time for response (48-72 hours)

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8174)
- [Helmet.js Security](https://helmetjs.github.io/)
- [bcryptjs Documentation](https://www.npmjs.com/package/bcryptjs)
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)

---

**Last Updated**: February 28, 2026
**Version**: 1.0.0
