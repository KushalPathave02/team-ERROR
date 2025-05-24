const { getDefaultConfig } = require('expo/metro-config');

// Get the default Metro configuration
const defaultConfig = getDefaultConfig(__dirname);

// Custom configuration
const config = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg']
  },
  transformer: {
    ...defaultConfig.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer')
  }
};

module.exports = config;
