import ApiError from '../exceptions/api-error.js';

export default function (err, req, res, next) {
  console.log(err);
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message, errors: err.errors });
  } else return res.status(500).json({ message: 'Uexpected error' });
}
