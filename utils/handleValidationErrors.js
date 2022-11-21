import { validationResult } from 'express-validator';

import ApiError from '../exceptions/api-error.js';

export default (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiError.BadRequest('Validation errors', errors.array());
  }
  next();
};
