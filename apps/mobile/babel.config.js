module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Tamagui babel plugin disabled due to ESM/CJS compatibility issues
      // The app will still work, just without compile-time optimizations
      'react-native-reanimated/plugin',
    ],
  };
};
