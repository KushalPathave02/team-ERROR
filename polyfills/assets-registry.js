// Mock implementation for assets-registry polyfill
// This prevents the "Expected file to be absolute path but got polyfill:assets-registry" error

const AssetsRegistry = {
  registerAsset: (asset) => asset,
  getAssetByID: () => null,
  containsAsset: () => false,
  unregisterAsset: () => null,
};

module.exports = AssetsRegistry;
