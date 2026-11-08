export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const requireFields = (body, fields) => {
  const missing = fields.filter((field) => {
    const value = body?.[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
  if (missing.length) {
    throw new ApiError(400, `Missing required field(s): ${missing.join(', ')}`);
  }
};
