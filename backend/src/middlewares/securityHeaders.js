const helmet = require('helmet');

const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], 
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            
            imgSrc: [
                "'self'", 
                "data:", 
                "https://console.cloudinary.com/app/c-1fcf2baea334e8c177880a76eca5ea/assets/media_library/folders/cfeaf948208979743741bdba956853d6a2?view_mode=mosaic" 
            ],
            
            connectSrc: [
                "'self'", 
                "ws://localhost:*", 
                "wss://*.yourdomain.com"
            ],
            
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            
            upgradeInsecureRequests: [],
        },
    },
    
    crossOriginEmbedderPolicy: false,
    
    frameguard: {
        action: 'deny'
    },
    
    hidePoweredBy: true,
    
    hsts: {
        maxAge: 31536000, 
        includeSubDomains: true,
        preload: true
    },
    
    noSniff: true,
    
    xssFilter: true
});

module.exports = securityHeaders;