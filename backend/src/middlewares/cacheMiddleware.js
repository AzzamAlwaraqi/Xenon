const NodeCache = require("node-cache");

// Standard cache (TTL 5 minutes by default)
// We set checkperiod to automatically clear expired items
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

/**
 * Middleware to cache HTTP responses
 * @param {number} duration - Time to live in seconds
 */
const cacheMiddleware = (duration) => {
    return (req, res, next) => {
        if (req.method !== "GET") {
            return next();
        }

        // Use the request URL as the cache key
        const key = req.originalUrl;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            console.log(`[Cache] HIT for key: ${key}`);
            return res.json(cachedResponse);
        }

        console.log(`[Cache] MISS for key: ${key}`);
        
        // Override res.json to capture the response before sending it
        const originalJson = res.json;
        res.json = (body) => {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                let cacheableBody = body;
                try {
                    cacheableBody = JSON.parse(JSON.stringify(body));
                } catch(e) {}
                cache.set(key, cacheableBody, duration);
            }
            // Call the original res.json
            return originalJson.call(res, body);
        };

        next();
    };
};

/**
 * Helper to clear cache manually if needed (e.g., when a package is created/updated)
 * @param {string} keyPattern - The start of the URL to clear (e.g., "/api/v1/packages")
 */
const clearCache = (keyPattern) => {
    const keys = cache.keys();
    const keysToDelete = keys.filter(key => key.startsWith(keyPattern));
    if (keysToDelete.length > 0) {
        cache.del(keysToDelete);
        console.log(`[Cache] Cleared keys: ${keysToDelete.join(', ')}`);
    }
};

module.exports = {
    cacheMiddleware,
    clearCache
};
