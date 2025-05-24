module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            // Handle both formats of the assets-registry reference
            'assets-registry': 'expo-asset/build/AssetRegistry',
            'polyfill:assets-registry': 'expo-asset/build/AssetRegistry'
          },
          // Define custom resolver for polyfill: prefixed modules
          resolvePath(sourcePath, currentFile, opts) {
            if (sourcePath === 'polyfill:assets-registry') {
              return require.resolve('expo-asset/build/AssetRegistry');
            }
            return undefined;
          }
        }
      ]
    ]
  };
};
