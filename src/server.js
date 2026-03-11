// src/server.js
/**
 * Entry Point for Smart Travel Planning & Budget Management System
 * Initializes database connections, starts Express server, and handles graceful shutdown
 */

require('dotenv').config();

// Import Express app configuration
const app = require('./app');

// Import database connections
const connectDB = require('./config/database');
const redisClient = require('./config/redis');

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

/**
 * Initialize Database Connection
 * Connects to MongoDB and initializes Redis cache
 */
connectDB();

// Optional: Initialize Redis client (if needed)
if (redisClient) {
  redisClient.on('connect', () => {
    console.log('Redis connected');
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });
}

/**
 * Start Express Server
 * Listens on specified PORT and logs startup information
 */
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   SMART TRAVEL PLANNING & BUDGET MANAGEMENT SYSTEM    ║
║                                                        ║
║   ✓ Server running on port ${PORT}                    ║
║   ✓ Environment: ${(process.env.NODE_ENV || 'development').padEnd(25)}   ║
║   ✓ Database: ${(process.env.MONGODB_URI ? 'Connected' : 'Connecting...').padEnd(22)}  ║
║   ✓ Redis: ${(process.env.REDIS_URL ? 'Ready' : 'Standby').padEnd(25)}       ║
║   ✓ Time: ${new Date().toISOString().padEnd(28)}║
║                                                        ║
║   API Health: http://localhost:${PORT}/api/health     ║
║   API Docs: http://localhost:${PORT}/api/version      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

/**
 * Handle SIGTERM signal (Termination signal)
 * Gracefully close server and connections
 */
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✓ HTTP server closed');
    if (redisClient) {
      redisClient.quit(() => {
        console.log('✓ Redis connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});

/**
 * Handle SIGINT signal (Interrupt signal - Ctrl+C)
 * Gracefully close server and connections
 */
process.on('SIGINT', () => {
  console.log('⚠️  SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✓ HTTP server closed');
    if (redisClient) {
      redisClient.quit(() => {
        console.log('✓ Redis connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});

/**
 * Handle Uncaught Exceptions
 * Log and exit gracefully
 */
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

/**
 * Handle Unhandled Promise Rejections
 * Log and exit gracefully
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ============================================
// EXPORTS
// ============================================

module.exports = app;
