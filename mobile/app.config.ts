import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "PagalPagal",
  slug: "pagalpagal",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  scheme: "pagalpagal",
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.pagalpagal.app",
  },
  android: {
    package: "com.pagalpagal.app",
    versionCode: 1,
    // Needed for the direct-IP HTTP backend while the domain points elsewhere.
    // @ts-expect-error supported by Expo builds but not in this SDK's TS type
    usesCleartextTraffic: true,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FF5A1F",
    },
    permissions: ["INTERNET", "ACCESS_NETWORK_STATE"],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
});
