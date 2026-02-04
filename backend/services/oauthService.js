// backend/services/oauthService.js

const crypto = require('crypto');

/**
 * OAuth 2.0 Service for social login integration
 * Supports: Google, GitHub, Microsoft
 */
class OAuthService {
  /**
   * Generate OAuth authorization URL
   */
  static generateAuthorizationUrl(provider, state) {
    const configs = {
      google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        clientId: process.env.GOOGLE_CLIENT_ID,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        scope: 'openid email profile',
      },
      github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        clientId: process.env.GITHUB_CLIENT_ID,
        redirectUri: process.env.GITHUB_REDIRECT_URI,
        scope: 'read:user user:email',
      },
      microsoft: {
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        clientId: process.env.MICROSOFT_CLIENT_ID,
        redirectUri: process.env.MICROSOFT_REDIRECT_URI,
        scope: 'openid email profile',
      },
    };

    if (!configs[provider]) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const config = configs[provider];
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope,
      state: state,
      access_type: 'offline',
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(provider, code) {
    const configs = {
      google: {
        tokenUrl: 'https://oauth2.googleapis.com/token',
      },
      github: {
        tokenUrl: 'https://github.com/login/oauth/access_token',
      },
      microsoft: {
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      },
    };

    if (!configs[provider]) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const config = {
      ...configs[provider],
      clientId:
        {
          google: process.env.GOOGLE_CLIENT_ID,
          github: process.env.GITHUB_CLIENT_ID,
          microsoft: process.env.MICROSOFT_CLIENT_ID,
        }[provider],
      clientSecret:
        {
          google: process.env.GOOGLE_CLIENT_SECRET,
          github: process.env.GITHUB_CLIENT_SECRET,
          microsoft: process.env.MICROSOFT_CLIENT_SECRET,
        }[provider],
      redirectUri:
        {
          google: process.env.GOOGLE_REDIRECT_URI,
          github: process.env.GITHUB_REDIRECT_URI,
          microsoft: process.env.MICROSOFT_REDIRECT_URI,
        }[provider],
    };

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    });

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`OAuth token exchange error: ${error.message}`);
    }
  }

  /**
   * Get user info from OAuth provider
   */
  static async getUserInfo(provider, accessToken) {
    const endpoints = {
      google: 'https://www.googleapis.com/oauth2/v1/userinfo',
      github: 'https://api.github.com/user',
      microsoft: 'https://graph.microsoft.com/v1.0/me',
    };

    if (!endpoints[provider]) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    try {
      const response = await fetch(endpoints[provider], {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`User info request failed: ${response.statusText}`);
      }

      const userInfo = await response.json();

      // Normalize user info across providers
      return this._normalizeUserInfo(provider, userInfo);
    } catch (error) {
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  /**
   * Normalize user info from different OAuth providers
   */
  static _normalizeUserInfo(provider, userInfo) {
    const normalized = {
      provider,
      providerId: null,
      email: null,
      name: null,
      avatar: null,
      emailVerified: false,
      metadata: userInfo,
    };

    switch (provider) {
      case 'google':
        normalized.providerId = userInfo.id;
        normalized.email = userInfo.email;
        normalized.name = userInfo.name;
        normalized.avatar = userInfo.picture;
        normalized.emailVerified = userInfo.verified_email;
        break;

      case 'github':
        normalized.providerId = userInfo.id.toString();
        normalized.email = userInfo.email;
        normalized.name = userInfo.name || userInfo.login;
        normalized.avatar = userInfo.avatar_url;
        normalized.emailVerified = true; // GitHub requires email verification
        break;

      case 'microsoft':
        normalized.providerId = userInfo.id;
        normalized.email = userInfo.userPrincipalName || userInfo.mail;
        normalized.name = userInfo.displayName;
        normalized.avatar = null; // Microsoft doesn't provide avatar in this endpoint
        normalized.emailVerified = true;
        break;
    }

    return normalized;
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(provider, refreshToken) {
    const configs = {
      google: {
        tokenUrl: 'https://oauth2.googleapis.com/token',
      },
      github: {
        tokenUrl: 'https://github.com/login/oauth/access_token',
      },
      microsoft: {
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      },
    };

    if (!configs[provider]) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const params = new URLSearchParams({
      client_id:
        {
          google: process.env.GOOGLE_CLIENT_ID,
          github: process.env.GITHUB_CLIENT_ID,
          microsoft: process.env.MICROSOFT_CLIENT_ID,
        }[provider],
      client_secret:
        {
          google: process.env.GOOGLE_CLIENT_SECRET,
          github: process.env.GITHUB_CLIENT_SECRET,
          microsoft: process.env.MICROSOFT_CLIENT_SECRET,
        }[provider],
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    try {
      const response = await fetch(configs[provider].tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`OAuth token refresh error: ${error.message}`);
    }
  }

  /**
   * Generate PKCE challenge for OAuth security
   */
  static generatePKCEChallenge() {
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return {
      codeVerifier,
      codeChallenge,
    };
  }

  /**
   * Generate state parameter for CSRF protection
   */
  static generateState() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify state parameter
   */
  static verifyState(state, storedState) {
    return crypto.timingSafeEqual(
      Buffer.from(state),
      Buffer.from(storedState)
    );
  }

  /**
   * Link OAuth account to existing user
   */
  static linkOAuthAccount(user, oauthInfo) {
    if (!user.oauthAccounts) {
      user.oauthAccounts = [];
    }

    // Check if account already linked
    const existing = user.oauthAccounts.find(
      (a) =>
        a.provider === oauthInfo.provider &&
        a.providerId === oauthInfo.providerId
    );

    if (existing) {
      return existing;
    }

    const linkedAccount = {
      provider: oauthInfo.provider,
      providerId: oauthInfo.providerId,
      email: oauthInfo.email,
      name: oauthInfo.name,
      avatar: oauthInfo.avatar,
      linkedAt: new Date().toISOString(),
      accessToken: null, // Don't store sensitive tokens in DB
      refreshToken: null, // Use Redis or separate encrypted storage
    };

    user.oauthAccounts.push(linkedAccount);
    return linkedAccount;
  }

  /**
   * Unlink OAuth account from user
   */
  static unlinkOAuthAccount(user, provider) {
    if (!user.oauthAccounts) {
      return false;
    }

    const initialLength = user.oauthAccounts.length;
    user.oauthAccounts = user.oauthAccounts.filter(
      (a) => a.provider !== provider
    );

    return user.oauthAccounts.length < initialLength;
  }

  /**
   * Find or create user from OAuth info
   */
  static async findOrCreateUser(oauthInfo) {
    // In production, query database
    // This is a mock implementation

    // Try to find existing user by email
    let user = null; // await User.findOne({ email: oauthInfo.email });

    if (!user) {
      // Create new user
      user = {
        id: Date.now(),
        email: oauthInfo.email,
        name: oauthInfo.name,
        avatar: oauthInfo.avatar,
        emailVerified: oauthInfo.emailVerified,
        provider: oauthInfo.provider,
        providerId: oauthInfo.providerId,
        oauthAccounts: [
          {
            provider: oauthInfo.provider,
            providerId: oauthInfo.providerId,
            linkedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      };
    } else {
      // Link existing account if not already linked
      this.linkOAuthAccount(user, oauthInfo);
    }

    return user;
  }
}

module.exports = OAuthService;
