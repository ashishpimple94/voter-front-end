const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 [setupProxy] Initializing proxy middleware...');
  
  // Proxy for WhatsApp API - forward to local proxy server in development
  // IMPORTANT: This must be BEFORE the generic /api proxy
  const whatsappProxy = createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/whatsapp-send': '/api/whatsapp-send', // Keep same path
    },
    logLevel: 'debug',
    secure: false,
    timeout: 30000,
    ws: false,
    onProxyReq: (proxyReq, req, res) => {
      console.log('📤 [setupProxy] === WhatsApp Proxy Request ===');
      console.log('📤 [setupProxy] Original URL:', req.url);
      console.log('📤 [setupProxy] Original Path:', req.path);
      console.log('📤 [setupProxy] Proxy Target Path:', proxyReq.path);
      console.log('📤 [setupProxy] Method:', req.method);
      console.log('📤 [setupProxy] Headers:', JSON.stringify(req.headers, null, 2));
      // Ensure Content-Type is set
      if (!proxyReq.getHeader('Content-Type')) {
        proxyReq.setHeader('Content-Type', 'application/json');
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('📥 [setupProxy] === WhatsApp Proxy Response ===');
      console.log('📥 [setupProxy] Status:', proxyRes.statusCode);
      console.log('📥 [setupProxy] URL:', req.url);
    },
    onError: (err, req, res) => {
      console.error('❌ [setupProxy] === WhatsApp Proxy Error ===');
      console.error('❌ [setupProxy] Error:', err.message);
      console.error('❌ [setupProxy] Code:', err.code);
      console.error('❌ [setupProxy] Request URL:', req.url);
      console.error('❌ [setupProxy] Request Path:', req.path);
      console.error('💡 [setupProxy] Make sure proxy server is running: npm run server');
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          error: 'Proxy server not available',
          message: 'Please start the proxy server: npm run server',
          details: err.message,
          code: err.code
        });
      }
    }
  });
  
  // Apply the proxy middleware
  app.use('/api/whatsapp-send', whatsappProxy);
  console.log('✅ [setupProxy] WhatsApp proxy configured at /api/whatsapp-send -> http://localhost:3001/api/whatsapp-send');

  // Proxy for voter data API (xtend.online)
  app.use(
    '/api/Voter',
    createProxyMiddleware({
      target: 'https://xtend.online',
      changeOrigin: true,
      pathRewrite: {
        '^/api/Voter': '/Voter', // Keep /Voter prefix
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

