/**
 * CORS Middleware - Allow all origins
 */

import cors from 'cors';

const corsMiddleware = cors({
    origin: '*',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['X-Cache', 'Cache-Control'],
    credentials: false,
    maxAge: 86400, // 24 hours
});

export default corsMiddleware;
