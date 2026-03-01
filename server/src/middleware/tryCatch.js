/**
 * Higher-order function that wraps async route handlers
 * to automatically catch errors and forward to Express error handler.
 */
const TryCatch = (handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export default TryCatch;
