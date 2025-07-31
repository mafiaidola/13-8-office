// Load configuration from environment or config file
const path = require('path');

// Environment variable overrides
const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === 'true',
};

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      
      // Disable hot reload completely if environment variable is set
      if (config.disableHotReload) {
        // Remove hot reload related plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });
        
        // Disable watch mode
        webpackConfig.watch = false;
        webpackConfig.watchOptions = {
          ignored: /.*/, // Ignore all files
        };
      } else {
        // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
          ],
        };
      }
      
      return webpackConfig;
    },
  },
  devServer: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: 'all',
    hot: !config.disableHotReload,
    client: {
      webSocketURL: 'wss://localhost:3000/ws',
    },
    setupMiddlewares: (middlewares, devServer) => {
      // API proxy middleware
      devServer.app.use('/api', require('http-proxy-middleware').createProxyMiddleware({
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        onError: (err, req, res) => {
          console.log('Proxy error:', err);
        },
        onProxyReq: (proxyReq, req, res) => {
          console.log('Proxying request:', req.method, req.url, '-> http://localhost:8001' + req.url);
        }
      }));
      
      return middlewares;
    },
  },
};