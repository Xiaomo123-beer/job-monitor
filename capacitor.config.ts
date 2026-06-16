import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.jobmonitor.app",
  appName: "岗位监测助手",
  webDir: "public",
  // No server.url — load local index.html which prompts for backend URL
  // User enters their deployed backend URL on first launch
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_briefcase",
      iconColor: "#7c3aed",
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;

