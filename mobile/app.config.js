// mobile/app.config.js - React Native App Configuration

export default {
  expo: {
    name: 'Law Firm Task Management',
    slug: 'law-firm-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTabletMode: true,
      requireFullScreen: true,
      infoPlist: {
        NSFaceIDUsageDescription:
          'This app uses Face ID for secure authentication',
        NSTouchIDUsageDescription:
          'This app uses Touch ID for secure authentication',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: ['CAMERA', 'FACE_UNLOCK', 'BIOMETRIC'],
      package: 'com.lawfirm.taskmanagement',
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      [
        'expo-face-detector',
        {
          faceDetectorPermissions: [],
        },
      ],
      [
        'expo-local-authentication',
        {
          faceIDPermission: 'Allow $(PRODUCT_NAME) to use Face ID',
          touchIDPermission: 'Allow $(PRODUCT_NAME) to use Touch ID',
        },
      ],
      [
        'expo-notifications',
        {
          icons: ['./assets/notification-icon.png'],
          sounds: ['./assets/notification.wav'],
        },
      ],
    ],
    extra: {
      apiUrl: process.env.API_URL || 'https://api.example.com',
      environment: process.env.ENV || 'production',
    },
  },
};
