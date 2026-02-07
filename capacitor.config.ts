import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wonsun.prismpulse',
  appName: 'Prism Pulse',
  webDir: 'dist',
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-4817475918283790~8916632999',
    },
  },
};

export default config;
