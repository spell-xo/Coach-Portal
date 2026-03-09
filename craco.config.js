module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Polyfills for Node.js modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
      };

      // Fix file watching issues on macOS
      webpackConfig.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild after change
        ignored: /node_modules/, // Ignore node_modules for better performance
      };

      return webpackConfig;
    },
  },
};
