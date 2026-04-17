const logger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown'
    };
    
    if (req.userId) {
      log.userId = req.userId;
    }
    
    if (req.apiKeyId) {
      log.apiKeyId = req.apiKeyId;
    }
    
    if (res.statusCode >= 400) {
      console.error(JSON.stringify(log));
    } else {
      console.log(JSON.stringify(log));
    }
  });
  
  next();
};

module.exports = logger;
