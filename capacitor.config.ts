import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hilex.mobile',
  appName: 'HiLEX Mobile',
  webDir: 'dist',
  ios: {
    limitsNavigationsToAppBoundDomains: true,
    scrollEnabled: true
  },
  server: {
    allowNavigation: ['*']
  }
};

export default config;
