import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vidgrab.app',
  appName: 'VidGrab',
  webDir: 'dist',
  
  // Android-specific settings
  android: {
    // Allow cleartext HTTP traffic (needed for local network connections)
    allowMixedContent: true,
  },
  
  // Server settings for development
  server: {
    // Allow loading from HTTP URLs
    cleartext: true,
    // Allow navigation to any URL
    allowNavigation: ['*'],
  },
};

export default config;
