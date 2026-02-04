// backend/services/biometricService.js

const crypto = require('crypto');

class BiometricService {
  /**
   * Generate a biometric enrollment challenge
   * This is used to start the biometric registration process
   */
  static generateEnrollmentChallenge(userId) {
    const challenge = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();

    return {
      challenge,
      timestamp,
      userId,
      expiresAt: timestamp + 5 * 60 * 1000, // 5 minutes
    };
  }

  /**
   * Verify biometric enrollment
   * Validates that the biometric data matches the enrollment challenge
   */
  static async verifyEnrollment(enrollmentData, biometricResponse) {
    // Simulate biometric verification
    // In production, this would integrate with a biometric API (Windows Hello, Apple FaceID, etc.)

    const isValid =
      enrollmentData.challenge === biometricResponse.challenge &&
      enrollmentData.userId === biometricResponse.userId &&
      Date.now() < enrollmentData.expiresAt;

    if (!isValid) {
      throw new Error('Invalid biometric enrollment');
    }

    // Generate biometric credential ID
    const credentialId = crypto
      .createHash('sha256')
      .update(biometricResponse.attestationObject)
      .digest('hex');

    return {
      credentialId,
      credentialPublicKey: biometricResponse.credentialPublicKey,
      enrolledAt: new Date().toISOString(),
      signCount: 0,
      transports: biometricResponse.transports || [],
    };
  }

  /**
   * Create a biometric authentication challenge
   */
  static generateAuthChallenge(userId, credentials) {
    const challenge = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();

    return {
      challenge,
      timestamp,
      userId,
      credentialIds: credentials.map((c) => c.credentialId),
      expiresAt: timestamp + 5 * 60 * 1000, // 5 minutes
    };
  }

  /**
   * Verify biometric authentication assertion
   */
  static async verifyAssertion(authChallenge, biometricResponse, storedCredential) {
    // Verify challenge
    if (authChallenge.challenge !== biometricResponse.challenge) {
      throw new Error('Challenge mismatch');
    }

    // Verify credential ID
    if (storedCredential.credentialId !== biometricResponse.credentialId) {
      throw new Error('Credential ID mismatch');
    }

    // Verify signature count (simple replay attack prevention)
    if (biometricResponse.signCount <= storedCredential.signCount) {
      throw new Error('Invalid sign count - possible cloned authenticator');
    }

    // Verify authenticator data and signature
    const isValidSignature = this._verifySignature(
      biometricResponse.clientDataJSON,
      biometricResponse.authenticatorData,
      biometricResponse.signature,
      storedCredential.credentialPublicKey
    );

    if (!isValidSignature) {
      throw new Error('Invalid biometric signature');
    }

    return {
      credentialId: biometricResponse.credentialId,
      signCount: biometricResponse.signCount,
      authenticatedAt: new Date().toISOString(),
    };
  }

  /**
   * Verify digital signature (placeholder for actual implementation)
   */
  static _verifySignature(clientDataJSON, authenticatorData, signature, publicKey) {
    // In production, this would use WebAuthn verification libraries
    // like @simplewebauthn/server or passkeys
    // For now, return true (would fail in actual biometric auth)

    try {
      // Verify signature using public key
      const verifier = crypto.createVerify('sha256');
      const data = Buffer.concat([
        Buffer.from(authenticatorData, 'base64'),
        crypto
          .createHash('sha256')
          .update(clientDataJSON)
          .digest(),
      ]);

      verifier.update(data);
      return verifier.verify(publicKey, Buffer.from(signature, 'base64'));
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Decrypt biometric data (e.g., from Windows Hello)
   */
  static decryptBiometricData(encryptedData, encryptionKey) {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(encryptionKey, 'salt', 32);

      const [iv, encrypted, authTag] = encryptedData.split(':');

      const decipher = crypto.createDecipheriv(
        algorithm,
        key,
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return JSON.parse(decrypted.toString());
    } catch (error) {
      throw new Error(`Biometric data decryption failed: ${error.message}`);
    }
  }

  /**
   * Get supported biometric methods for the user's device
   */
  static getSupportedMethods(userAgent) {
    const methods = {
      faceRecognition: false,
      fingerprint: false,
      iris: false,
      voiceRecognition: false,
      platform: 'unknown',
    };

    // Detect platform
    if (userAgent.includes('Windows')) {
      methods.platform = 'windows';
      methods.faceRecognition = true; // Windows Hello Face
      methods.fingerprint = true; // Windows Hello Fingerprint
      methods.iris = true; // Windows Hello Iris
    } else if (userAgent.includes('Mac')) {
      methods.platform = 'macos';
      methods.faceRecognition = true; // Face ID via Touch ID API
      methods.fingerprint = true; // Touch ID
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      methods.platform = 'ios';
      methods.faceRecognition = true; // Face ID
      methods.fingerprint = true; // Touch ID
    } else if (userAgent.includes('Android')) {
      methods.platform = 'android';
      methods.fingerprint = true; // Android Biometric API
      methods.faceRecognition = true; // Face unlock (Android 10+)
    }

    return methods;
  }

  /**
   * Generate a timestamp-based backup code (in case of biometric failure)
   */
  static generateBackupCode() {
    return crypto
      .randomBytes(6)
      .toString('hex')
      .toUpperCase()
      .match(/.{1,4}/g)
      .join('-');
  }

  /**
   * Rate limit biometric attempts (anti-brute force)
   */
  static checkRateLimit(attempts, limit = 5, windowMs = 5 * 60 * 1000) {
    const now = Date.now();
    const recentAttempts = attempts.filter((attempt) => now - attempt < windowMs);

    return {
      canAttempt: recentAttempts.length < limit,
      remaining: Math.max(0, limit - recentAttempts.length),
      resetTime: recentAttempts.length > 0 
        ? new Date(Math.min(...recentAttempts) + windowMs)
        : null,
    };
  }
}

module.exports = BiometricService;
