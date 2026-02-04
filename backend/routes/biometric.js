// backend/routes/biometric.js

const express = require('express');
const router = express.Router();
const BiometricService = require('../services/biometricService');
const { authMiddleware } = require('../middleware/auth');

// Store biometric challenges in memory (use Redis in production)
const biometricChallenges = new Map();

/**
 * POST /api/biometric/enrollment/start
 * Begin biometric enrollment process
 */
router.post('/enrollment/start', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const userAgent = req.get('user-agent');

    // Check supported biometric methods
    const supportedMethods = BiometricService.getSupportedMethods(userAgent);

    // Generate enrollment challenge
    const challenge = BiometricService.generateEnrollmentChallenge(userId);

    // Store challenge temporarily
    biometricChallenges.set(`enroll-${userId}`, challenge);

    res.json({
      challenge: challenge.challenge,
      supportedMethods,
      expiresIn: 300, // 5 minutes
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/biometric/enrollment/verify
 * Verify and complete biometric enrollment
 */
router.post('/enrollment/verify', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { attestationObject, clientDataJSON, transports, type } =
      req.body;

    // Get stored challenge
    const enrollmentChallenge = biometricChallenges.get(`enroll-${userId}`);
    if (!enrollmentChallenge) {
      return res.status(400).json({ error: 'Enrollment challenge not found' });
    }

    // Verify enrollment
    const credential = await BiometricService.verifyEnrollment(
      enrollmentChallenge,
      {
        challenge: enrollmentChallenge.challenge,
        userId,
        attestationObject,
        clientDataJSON,
        credentialPublicKey: Buffer.from(clientDataJSON).toString('base64'),
        transports,
      }
    );

    // Store credential in database (in-memory for now)
    if (!req.user.biometricCredentials) {
      req.user.biometricCredentials = [];
    }

    req.user.biometricCredentials.push({
      ...credential,
      type,
      nickname: `${type} - ${new Date().toLocaleDateString()}`,
      enrolledAt: new Date().toISOString(),
    });

    // Clean up challenge
    biometricChallenges.delete(`enroll-${userId}`);

    res.json({
      success: true,
      credentialId: credential.credentialId,
      message: 'Biometric enrollment successful',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/biometric/auth/challenge
 * Create biometric authentication challenge
 */
router.post('/auth/challenge', async (req, res) => {
  try {
    const { email } = req.body;

    // In production, look up user by email
    // For now, use mock data
    const user = {
      id: 1,
      email,
      biometricCredentials: [],
    };

    if (!user.biometricCredentials || user.biometricCredentials.length === 0) {
      return res.status(400).json({
        error: 'No biometric credentials registered for this user',
      });
    }

    // Generate auth challenge
    const challenge = BiometricService.generateAuthChallenge(
      user.id,
      user.biometricCredentials
    );

    // Store challenge temporarily
    biometricChallenges.set(`auth-${user.id}`, challenge);

    res.json({
      challenge: challenge.challenge,
      credentialIds: challenge.credentialIds,
      expiresIn: 300, // 5 minutes
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/biometric/auth/verify
 * Verify biometric authentication assertion
 */
router.post('/auth/verify', async (req, res) => {
  try {
    const {
      credentialId,
      clientDataJSON,
      authenticatorData,
      signature,
      userId,
    } = req.body;

    // Get stored challenge
    const authChallenge = biometricChallenges.get(`auth-${userId}`);
    if (!authChallenge) {
      return res.status(400).json({ error: 'Authentication challenge expired' });
    }

    // Lookup user and credential (mock implementation)
    const user = {
      id: userId,
      biometricCredentials: [
        {
          credentialId,
          credentialPublicKey: 'mock-public-key',
          signCount: 0,
        },
      ],
    };

    const credential = user.biometricCredentials.find(
      (c) => c.credentialId === credentialId
    );

    if (!credential) {
      return res
        .status(400)
        .json({ error: 'Credential not found' });
    }

    // Verify assertion
    const verification = await BiometricService.verifyAssertion(
      authChallenge,
      {
        challenge: authChallenge.challenge,
        credentialId,
        clientDataJSON,
        authenticatorData,
        signature,
        signCount: req.body.signCount || credential.signCount + 1,
      },
      credential
    );

    // Update sign count (prevent cloning)
    credential.signCount = verification.signCount;

    // Generate JWT tokens
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        biometricVerified: true,
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Clean up challenge
    biometricChallenges.delete(`auth-${userId}`);

    res.json({
      success: true,
      accessToken,
      message: 'Biometric authentication successful',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/biometric/credentials
 * List enrolled biometric credentials
 */
router.get('/credentials', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;

    // Mock implementation
    const credentials = req.user.biometricCredentials || [];

    const sanitized = credentials.map((c) => ({
      credentialId: c.credentialId,
      type: c.type,
      nickname: c.nickname,
      enrolledAt: c.enrolledAt,
      lastUsed: c.lastUsed,
      transports: c.transports,
    }));

    res.json({
      credentials: sanitized,
      count: sanitized.length,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/biometric/credentials/:credentialId
 * Remove biometric credential
 */
router.delete('/credentials/:credentialId', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const { credentialId } = req.params;

    // Remove credential from user's array
    if (req.user.biometricCredentials) {
      req.user.biometricCredentials = req.user.biometricCredentials.filter(
        (c) => c.credentialId !== credentialId
      );
    }

    res.json({
      success: true,
      message: 'Biometric credential removed',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/biometric/backup-codes
 * Generate backup codes for biometric enrollment
 */
router.post('/backup-codes', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;

    // Generate 10 backup codes
    const backupCodes = Array(10)
      .fill(null)
      .map(() => BiometricService.generateBackupCode());

    // Store hashed codes (mock)
    req.user.biometricBackupCodes = backupCodes;

    res.json({
      success: true,
      backupCodes,
      message:
        'Save these codes in a secure location. You can use them to regain access if biometric authentication fails.',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/biometric/status
 * Get biometric authentication status
 */
router.get('/status', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;

    res.json({
      enabled: (req.user.biometricCredentials || []).length > 0,
      credentials: (req.user.biometricCredentials || []).length,
      backupCodesAvailable: (req.user.biometricBackupCodes || []).length > 0,
      lastUsed: req.user.biometricLastUsed || null,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
