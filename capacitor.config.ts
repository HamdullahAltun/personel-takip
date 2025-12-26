import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.personel.app',
  appName: 'Personel Takip',
  webDir: 'public',
  server: {
    url: 'https://personel-takip-liard.vercel.app/',
    androidScheme: 'https'
  }
};

export default config;
