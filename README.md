# BHW Backend

Minimal instructions to run the BHW backend locally.

Prerequisites
- Node.js (v16+ recommended)
- npm

Install dependencies
```bash
npm install
```

Environment
- Create a `.env` file in the project root to configure optional values.
- Examples:
```
# Optional: MongoDB connection string. If omitted, the server will start without DB.
MONGO_URI=mongodb://127.0.0.1:27017/bhw_backend

# Optional admin credentials used only for initial bootstrap (can be overridden by DB users)
ADMIN_USER=admin
ADMIN_PASS=password

# JWT secret
JWT_SECRET=change_this_secret
```

Run the server
```bash
node app.js
```

Notes
- The server will skip connecting to MongoDB if `MONGO_URI` is not provided — this lets you run the API without a database for development or frontend integration tests. Endpoints that read/write data will require a running MongoDB to function properly.
- To get an admin JWT when no user exists, POST to `/api/auth/login` with `ADMIN_USER` and `ADMIN_PASS` credentials (this will create the admin user on first successful env-based login).
- Useful routes:
  - `POST /api/auth/login` — body: `{ "username": "...", "password": "..." }` → returns `{ token }`
  - `GET /api/residents` — protected, requires `Authorization: Bearer <token>`
  - `POST /api/residents` — protected
  - `POST /api/immunizations` — protected
  - `GET /api/immunizations/:residentId` — protected
  - `POST /api/inventory` — protected
  - `GET /api/inventory` — protected
  - `GET /api/report/summary` — protected

If you want me to fully remove all DB code instead of making it optional, tell me and I'll stub models and controllers accordingly.
