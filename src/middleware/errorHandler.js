/**
 * Global Error Handler Middleware
 */

/**
 * Not Found (404) Handler
 */
export function notFoundHandler(req, res, next) {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
    });
}

/**
 * Global Error Handler
 */
export function errorHandler(err, req, res, next) {
    console.error('Error:', err.message);

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
        });
    }

    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message;

    res.status(statusCode).json({
        error: statusCode === 500 ? 'Internal Server Error' : 'Error',
        message,
    });
}

export default errorHandler;
