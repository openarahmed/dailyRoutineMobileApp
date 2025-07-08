module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // no plugins needed if you don't use nativewind or others
  };
};
