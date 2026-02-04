const redis = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Advanced Rate Limiting Middleware
 * Implements distributed rate limiting with Redis for multi-server deployments
 * Supports different tiers: public, authenticated, premium
 */

class AdvancedRateLimiter {
  constructor() {
    this.tiers = {
      public: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        message: 'Too many requests from this IP, please try again later.'
      },
      authenticated: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 500,
        message: 'Rate limit exceeded for authenticated users.'
      },
      premium: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 2000,
        message: 'Rate limit exceeded for premium users.'
      },
      api: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 1000,
        message: 'API rate limit exceeded.'
      },
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        message: 'Too many authentication attempts. Please try again later.'
      },
      upload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 50,
        message: 'Too many file uploads. Please try again later.'
      }
    };
  }

  /**
   * Get rate limit configuration based on user tier
   * @param {Object} req - Express request object
   * @returns {Object} Rate limit config
   */
  getTierConfig(req) {
    // Check for premium users
    if (req.user && req.user.subscription === 'premium') {
      return this.tiers.premium;
    }

    // Check for authenticated users
    if (req.user) {
      return this.tiers.authenticated;
    }

    // Default to public
    return this.tiers.public;
  }

  /**
   * Generate Redis key for rate limiting
   * @param {string} identifier - IP or user ID
   * @param {string} endpoint - API endpoint
   * @returns {string} Redis key
   */
  generateKey(identifier, endpoint) {
    return `ratelimit:${endpoint}:${identifier}`;
  }

  /**
   * Get client identifier (IP or user ID)
   * @param {Object} req - Express request object
   * @returns {string} Client identifier
   */
  getClientIdentifier(req) {
    if (req.user) {
      return `user:${req.user.id}`;
    }
    
    // Get IP from various headers (supports proxies)
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip
    );
  }

  /**
   * Main rate limiting middleware
   * @param {string} tier - Rate limit tier (public, authenticated, premium, api, auth, upload)
   * @returns {Function} Express middleware
   */
  middleware(tier = 'public') {
    return async (req, res, next) => {
      try {
        const config = this.tiers[tier] || this.getTierConfig(req);
        const identifier = this.getClientIdentifier(req);
        const endpoint = tier;
        const key = this.generateKey(identifier, endpoint);

        // Try to get current count from Redis
        let current = await redis.get(key);
        
        if (current === null) {
          // First request in this window
          await redis.setex(key, Math.floor(config.windowMs / 1000), '1');
          current = 0;
        } else {
          current = parseInt(current, 10);
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - current - 1));
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + config.windowMs).toISOString());

        // Check if limit exceeded
        if (current >= config.maxRequests) {
          logger.warn(`Rate limit exceeded for ${identifier} on ${endpoint}`);
          
          return res.status(429).json({
            success: false,
            error: config.message,
            retryAfter: Math.floor(config.windowMs / 1000),
            limit: config.maxRequests,
            remaining: 0
          });
        }

        // Increment counter
        await redis.incr(key);

        next();
      } catch (error) {
        logger.error('Rate limiting error:', error);
        // Fail open - allow request if Redis is down
        next();
      }
    };
  }

  /**
   * Dynamic rate limiter based on endpoint patterns
   * @param {Object} options - Configuration options
   * @returns {Function} Express middleware
   */
  dynamic(options = {}) {
    return async (req, res, next) => {
      // Determine tier based on endpoint
      let tier = 'public';

      if (req.path.includes('/api/auth/login') || req.path.includes('/api/auth/register')) {
        tier = 'auth';
      } else if (req.path.includes('/api/upload')) {
        tier = 'upload';
      } else if (req.path.startsWith('/api/')) {
        tier = 'api';
      }

      // Override with custom tier if provided
      if (options.tier) {
        tier = options.tier;
      }

      return this.middleware(tier)(req, res, next);
    };
  }

  /**
   * Custom rate limiter with specific configuration
   * @param {Object} config - Custom configuration
   * @returns {Function} Express middleware
   */
  custom(config) {
    return async (req, res, next) => {
      try {
        const identifier = this.getClientIdentifier(req);
        const key = this.generateKey(identifier, config.name || 'custom');

        let current = await redis.get(key);
        
        if (current === null) {
          await redis.setex(key, Math.floor(config.windowMs / 1000), '1');
          current = 0;
        } else {
          current = parseInt(current, 10);
        }

        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - current - 1));

        if (current >= config.maxRequests) {
          return res.status(429).json({
            success: false,
            error: config.message || 'Rate limit exceeded',
            retryAfter: Math.floor(config.windowMs / 1000)
          });
        }

        await redis.incr(key);
        next();
      } catch (error) {
        logger.error('Custom rate limiting error:', error);
        next();
      }
    };
  }

  /**
   * Reset rate limit for a specific user/IP
   * @param {string} identifier - User ID or IP
   * @param {string} tier - Rate limit tier
   */
  async reset(identifier, tier = 'public') {
    try {
      const key = this.generateKey(identifier, tier);
      await redis.del(key);
      logger.info(`Rate limit reset for ${identifier} on ${tier}`);
    } catch (error) {
      logger.error('Rate limit reset error:', error);
    }
  }

  /**
   * Get current rate limit status for a user/IP
   * @param {string} identifier - User ID or IP
   * @param {string} tier - Rate limit tier
   * @returns {Object} Status information
   */
  async getStatus(identifier, tier = 'public') {
    try {
      const config = this.tiers[tier];
      const key = this.generateKey(identifier, tier);
      const current = await redis.get(key);
      const ttl = await redis.ttl(key);

      return {
        limit: config.maxRequests,
        current: current ? parseInt(current, 10) : 0,
        remaining: Math.max(0, config.maxRequests - (current ? parseInt(current, 10) : 0)),
        resetIn: ttl > 0 ? ttl : Math.floor(config.windowMs / 1000)
      };
    } catch (error) {
      logger.error('Get rate limit status error:', error);
      return null;
    }
  }

  /**
   * Whitelist IP addresses (bypass rate limiting)
   * @returns {Function} Express middleware
   */
  whitelist(ips = []) {
    const whitelistedIPs = new Set(ips);

    return (req, res, next) => {
      const clientIP = this.getClientIdentifier(req);
      
      if (whitelistedIPs.has(clientIP)) {
        return next();
      }

      // Continue with normal rate limiting
      return this.middleware('public')(req, res, next);
    };
  }

  /**
   * Adaptive rate limiting based on server load
   * Reduces limits when server is under heavy load
   * @param {Object} options - Configuration options
   * @returns {Function} Express middleware
   */
  adaptive(options = {}) {
    const baseConfig = options.baseConfig || this.tiers.public;
    const loadThreshold = options.loadThreshold || 0.8; // 80% CPU

    return async (req, res, next) => {
      try {
        // Get current server load (simplified - in production use actual metrics)
        const load = process.cpuUsage();
        const loadPercent = (load.user + load.system) / 1000000 / 1000; // Convert to percentage

        let adjustedMax = baseConfig.maxRequests;

        // Reduce limits if under heavy load
        if (loadPercent > loadThreshold) {
          adjustedMax = Math.floor(baseConfig.maxRequests * 0.5); // 50% reduction
          logger.warn(`Adaptive rate limiting: Reduced to ${adjustedMax} requests due to high load`);
        }

        const identifier = this.getClientIdentifier(req);
        const key = this.generateKey(identifier, 'adaptive');

        let current = await redis.get(key);
        
        if (current === null) {
          await redis.setex(key, Math.floor(baseConfig.windowMs / 1000), '1');
          current = 0;
        } else {
          current = parseInt(current, 10);
        }

        res.setHeader('X-RateLimit-Limit', adjustedMax);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, adjustedMax - current - 1));

        if (current >= adjustedMax) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Server is under heavy load.',
            retryAfter: Math.floor(baseConfig.windowMs / 1000)
          });
        }

        await redis.incr(key);
        next();
      } catch (error) {
        logger.error('Adaptive rate limiting error:', error);
        next();
      }
    };
  }
}

// Export singleton instance
module.exports = new AdvancedRateLimiter();
