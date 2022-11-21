import { body } from 'express-validator';

export const loginValidation = [
  body('email', 'Incorrect email format').isEmail(),
  body('password', 'Password must contain at least 5 characters').isLength({
    min: 5,
  }),
];

export const registerValidation = [
  body('email', 'Incorrect email format').isEmail(),
  body('password', 'Password must contain at least 5 characters').isLength({
    min: 5,
  }),
  body('fullName', 'Fullname must contain at least 4 characters').isLength({
    min: 5,
  }),
];

export const postCreateValidation = [];
