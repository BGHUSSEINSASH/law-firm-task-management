// backend/routes/oauth.js

const express = require('express');
const router = express.Router();
const OAuthService = require('../services/oauthService');
const jwt = require('jsonwebtoken');

// Store OAuth states in memory (use Redis in production)
const oauthStates = new Map();
const pkceVerifiers = new Map();

/**
 * GET /api/oauth/authorize/:provider
 * Start OAuth authorization flow
 */
router.get('/authorize/:provider', (req, res) => {
  try {
    const { provider } = req.params;
    const { redirectUrl } = req.query;

    // Generate state for CSRF protection
    const state = OAuthService.generateState();
    const pkce = OAuthService.generatePKCEChallenge();

    // Store state and PKCE verifier
    oauthStates.set(state, {
      provider,
      redirectUrl,
      createdAt: Date.now(),
    });

    pkceVerifiers.set(state, pkce.codeVerifier);

    // Get authorization URL
    const authUrl = OAuthService.generateAuthorizationUrl(provider, state);

    res.json({
      authUrl,
      state,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/oauth/callback/:provider
 * OAuth callback handler
 */
router.get('/callback/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, error, error_description } = req.query;

    // Check for OAuth errors
    if (error) {
      return res.status(400).json({
        error: error,
        description: error_description || 'OAuth authorization failed',
      });
    }

    // Verify state
    const oauthState = oauthStates.get(state);
    if (!oauthState || Date.now() - oauthState.createdAt > 10 * 60 * 1000) {
      return res.status(400).json({ error: 'Invalid or expired state parameter' });
    }

    // Exchange code for tokens
    const tokens = await OAuthService.exchangeCodeForToken(provider, code);

    // Get user info
    const oauthInfo = await OAuthService.getUserInfo(
      provider,
      tokens.access_token
    );

    // Find or create user
    const user = await OAuthService.findOrCreateUser(oauthInfo);

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        provider: provider,
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        type: 'refresh',
      },
      process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret',
      { expiresIn: '7d' }
    );

    // Clean up
    oauthStates.delete(state);
    pkceVerifiers.delete(state);

    // Redirect to frontend with tokens
    const redirectUrl = new URL(oauthState.redirectUrl || 'http://localhost:3000/auth/callback');
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);
    redirectUrl.searchParams.set('userId', user.id);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/oauth/link
 * Link OAuth account to authenticated user
 */
router.post('/link', async (req, res) => {
  try {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
    const decoded = jwt.verify(token, JWT_SECRET);

    const { provider, code, state } = req.body;

    // Verify state
    const oauthState = oauthStates.get(state);
    if (!oauthState) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    // Exchange code for tokens
    const tokens = await OAuthService.exchangeCodeForToken(provider, code);

    // Get user info
    const oauthInfo = await OAuthService.getUserInfo(
      provider,
      tokens.access_token
    );

    // Link account to current user (mock implementation)
    const linkedAccount = OAuthService.linkOAuthAccount(
      { id: decoded.id, oauthAccounts: [] },
      oauthInfo
    );

    // Clean up
    oauthStates.delete(state);

    res.json({
      success: true,
      provider: provider,
      email: linkedAccount.email,
      name: linkedAccount.name,
      message: `${provider} account linked successfully`,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/oauth/unlink
 * Unlink OAuth account
 */
router.post('/unlink', (req, res) => {
  try {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
    const decoded = jwt.verify(token, JWT_SECRET);

    const { provider } = req.body;

    // Check if user has at least one auth method remaining
    // In production, fetch user from database

    res.json({
      success: true,
      provider: provider,
      message: `${provider} account unlinked successfully`,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/oauth/accounts
 * Get linked OAuth accounts
 */
router.get('/accounts', (req, res) => {
  try {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
    const decoded = jwt.verify(token, JWT_SECRET);

    // In production, fetch accounts from database
    const accounts = [
      {
        provider: 'google',
        email: 'user@gmail.com',
        linkedAt: '2026-02-04T10:00:00Z',
      },
      {
        provider: 'github',
        email: 'user@github.com',
        linkedAt: '2026-02-04T11:00:00Z',
      },
    ];

    res.json({
      userId: decoded.id,
      accounts,
      count: accounts.length,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
