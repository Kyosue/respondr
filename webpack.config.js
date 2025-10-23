const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['react-native-reanimated'],
      },
    },
    argv
  );

  // Add web-specific optimizations
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  };

  // Add web-specific resolve configuration
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
    },
    fallback: {
      ...config.resolve.fallback,
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      buffer: require.resolve('buffer'),
    },
  };

  // Add web-specific plugins
  config.plugins = [
    ...config.plugins,
    new (require('webpack')).ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ];

  // Add HTML title and favicon configuration
  if (config.plugins) {
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    const htmlPlugin = config.plugins.find(plugin => plugin instanceof HtmlWebpackPlugin);
    if (htmlPlugin) {
      htmlPlugin.options.title = 'Respondr';
      htmlPlugin.options.favicon = './assets/images/logo-1.png';
    }
  }

  return config;
};
