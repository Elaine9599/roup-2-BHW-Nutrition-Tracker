const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

dotenv.config();

const connectDB = require('./config/db');
const passport = require('./config/passport');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ============ SECURITY MIDDLEWARE ============

// Helmet: Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// CORS: Restrict to frontend domain only
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Cookie Parser: Parse HTTP-only cookies
app.use(cookieParser());
// Initialize Passport for OAuth
app.use(passport.initialize());


// Body Parser: Parse JSON and URL-encoded requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging Middleware (for audit trails)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip;
  
  console.log(`[${timestamp}] ${method} ${path} - IP: ${ip}`);
  next();
});

// ============ ROUTES ============

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const residentRoutes = require('./routes/residentRoutes');
const immunizationRoutes = require('./routes/immunizationRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const bmiRoutes = require('./routes/bmiRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');


// Mount routes
app.use('/api/auth/google', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/immunizations', immunizationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/bmi', bmiRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'BHW Backend API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// ============ ERROR HANDLING ============

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't expose sensitive error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.status || 500).json({ 
    message,
    ...(process.env.NODE_ENV !== 'production' && { error: err.message })
  });
});

// ============ SERVER START ============

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Ensure HTTPS in production
if (NODE_ENV === 'production' && !process.env.HTTPS_ENABLED) {
  console.warn('⚠️  WARNING: HTTPS is not enabled. This is insecure for production. Set HTTPS_ENABLED=true');
}

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  BHW Nutrition Tracker Backend         ║
║  Environment: ${NODE_ENV.padEnd(23)}   ║
║  Port: ${PORT.toString().padEnd(31)}   ║
║  Secure: ${(NODE_ENV === 'production' ? 'HTTPS' : 'HTTP').padEnd(28)} ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
