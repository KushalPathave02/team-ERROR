// This is a hack to fix the polyfill:assets-registry error
// It provides a simple mock implementation that does nothing
// The module name ensures it gets loaded before other modules

module.exports = {
  // Mock the methods of AssetRegistry
  registerAsset: () => null,
  getAssetByID: () => null,
  unregisterAsset: () => null,
  containsAsset: () => false
};
