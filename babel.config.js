module.exports = function (api) {
  api.cache(true);
  let plugins = [];

  plugins.push("react-native-worklets/plugin");
  plugins.push(["@babel/plugin-transform-runtime", {
    helpers: true,
    regenerator: true,
  }]);

  // Remove console logs in production
  if (process.env.NODE_ENV === 'production') {
    plugins.push('transform-remove-console');
  }

  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins,
  };
};
