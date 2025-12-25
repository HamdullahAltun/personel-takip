import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.personel.app',
  appName: 'Personel Takip',
  webDir: 'public', // We point to public as a placeholder, but we rely on server.url
  server: {
    url: 'http://192.168.1.102:3000', // YOUR LOCAL IP
    cleartext: true, // Allow http
    androidScheme: 'http'
  }
};

export default config;
