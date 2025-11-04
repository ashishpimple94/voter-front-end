const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://xtend.online',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Remove /api prefix
      },
      secure: true,
      logLevel: 'info',
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying request:', req.url, '->', proxyReq.path);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
      }
    })
  );
};

