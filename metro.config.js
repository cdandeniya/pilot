// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'css' to assetExts for Mapbox GL web support
config.resolver.assetExts.push('css');

module.exports = config; 