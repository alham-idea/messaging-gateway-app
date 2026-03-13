const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// تحسينات الأداء
config.resolver.blacklistRE = /node_modules\/.*\/node_modules/;
config.transformer.minifierConfig = {
  keep_fnames: true,
  output: {
    ascii_only: true,
  },
};

// تحسين الذاكرة
config.maxWorkers = 4;
config.watchman = {
  useWatchman: true,
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
