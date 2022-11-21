import { validationResult } from 'express-validator';
import { v4 } from 'uuid';
import path from 'path';
import fs from 'fs';

import * as userService from '../service/user-service.js';
import UserSchema from '../models/user-model.js';
import ApiError from '../exceptions/api-error.js';

export const registration = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.BadRequest('Validation error', errors.array()));
    }
    const { email, password, fullName } = req.body;
    const userData = await userService.registration(email, password, fullName);
    res.cookie('refreshToken', userData.refreshToken, {
      maxAge: 2592000000,
      httpOnly: true,
    });
    return res.json(userData);
  } catch (e) {
    next(e);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userData = await userService.login(email, password);
    res.cookie('refreshToken', userData.refreshToken, {
      maxAge: 2592000000,
      httpOnly: true,
    });
    return res.json(userData);
  } catch (e) {
    next(e);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    const token = await userService.logout(refreshToken);
    res.clearCookie('refreshToken');
    return res.json(token);
  } catch (e) {
    next(e);
  }
};

export const activate = async (req, res, next) => {
  try {
    const activationLink = req.params.link;
    await userService.activate(activationLink);
    return res.redirect(process.env.CLIENT_URL);
  } catch (e) {
    next(e);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    const userData = await userService.refresh(refreshToken);
    res.cookie('refreshToken', userData.refreshToken, {
      maxAge: 2592000000,
      httpOnly: true,
    });
    return res.json(userData);
  } catch (e) {
    next(e);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    return res.json(users);
  } catch (e) {
    next(e);
  }
};

export const updateData = async (req, res) => {
  try {
    const user = await UserSchema.findById(req.userData.id);
    const { fullName } = req.body;

    // if (email) {
    //   const candidate = await UserSchema.findOne({ email });

    //   if (candidate) {
    //     if (candidate.userId !== req.userId) {
    //       return res.status(404).json({
    //         message: 'Email is used by another user',
    //       });
    //     }
    //   }
    // }

    const image = req.files?.image;
    const imageCover = req.files?.imageCover;

    if (fullName || image || imageCover) {
      if (image) {
        if (user.avatarUrl) {
          try {
            fs.unlinkSync(path.resolve('static/avatars', user.avatarUrl));
          } catch (error) {
            console.log(error);
          }
        }
        let fileName = v4() + '.jpg';
        image.mv(path.resolve('static/avatars', fileName));
        user.avatarUrl = fileName;
      }

      if (imageCover) {
        if (user.imageCoverUrl) {
          try {
            fs.unlinkSync(
              path.resolve('static/cover-images', user.imageCoverUrl)
            );
          } catch (error) {
            console.log(error);
          }
        }
        let fileName = v4() + '.jpg';
        imageCover.mv(path.resolve('static/cover-images', fileName));
        user.imageCoverUrl = fileName;
      }

      user.fullName = fullName;
      await user.save();
    }
    const { passwordHash, ...userData } = user._doc;
    res.json({ ...userData });
  } catch (err) {
    console.log(err);
  }
};
