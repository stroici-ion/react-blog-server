import ApiError from '../exceptions/api-error.js';
import * as tokenService from '../service/token-service.js';

export default function (req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;
    if (authorizationHeader) {
      const accessToken = authorizationHeader.split(' ')[1];
      if (accessToken) {
        const userData = tokenService.validateAccessToken(accessToken);
        if (userData) req.userData = userData;
      }
    }
    next();
  } catch (e) {
    return next(ApiError.BadRequest());
  }
}
