export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'VALIDATION_ERROR', details = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const sendSuccess = (res, data, meta = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta
  });
};

export const sendCreated = (res, data, meta = {}) => {
  return sendSuccess(res, data, meta, 201);
};
