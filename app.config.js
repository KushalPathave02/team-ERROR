module.exports = {
  name: 'NutriTrack',
  slug: 'nutritrack-foodie',
  version: '1.0.0',
  orientation: 'portrait',
  platforms: ['ios', 'android', 'web'],
  assetBundlePatterns: ['**/*'],
  entryPoint: "./index.js",
  android: {
    package: 'com.nutritrack.app'
  },
  ios: {
    bundleIdentifier: 'com.nutritrack.app'
  },
  // Disable bridgeless mode
  experiments: {
    tsconfigPaths: true,
    bridgeless: false
  }
};
