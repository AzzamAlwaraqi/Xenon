const { RateLimiterMemory } = require('rate-limiter-flexible');

const createRateLimiterMiddleware = (rateLimiterOptions, errorMessage) => {
    const limiter = new RateLimiterMemory(rateLimiterOptions);

    return (req, res, next) => {
        limiter.consume(req.ip)
            .then(() => {
                next();
            })
            .catch(() => {
                res.status(429).json({
                    status: 'fail',
                    message: errorMessage
                });
            });
    };
};


exports.globalLimiter = createRateLimiterMiddleware(
    {
        points: 1000, 
        duration: 15 * 60, 
    },
    'Too many requests from this IP. Please try again after 15 minutes.'
);


exports.authLimiter = createRateLimiterMiddleware(
    {
        points: 10, 
        duration: 60 * 60, 
    },
    'Too many failed attempts from this IP. Please try again after an hour to protect your account.'
);

exports.otpLimiter = createRateLimiterMiddleware(
    {
        points: 5, 
        duration: 15 * 60, 
    },
    'Too many OTP requests from this IP. Please try again after 15 minutes.'
);


exports.actionLimiter = createRateLimiterMiddleware(
    {
        points: 30, 
        duration: 15 * 60, 
    },
    'You are performing actions too quickly. Please slow down and try again later.'
);


exports.broadcastLimiter = createRateLimiterMiddleware(
    {
        points: 5, 
        duration: 60 * 60, 
    },
    'Too many broadcast notifications sent. Please wait an hour before sending more bulk notifications.'
);