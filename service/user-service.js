import bcrypt from 'bcrypt';
import { v4 } from 'uuid';

import UserModel from '../models/user-model.js';
import mailService from './mail-service.js';
import * as tokenService from './token-service.js';
import UserDto from '../dto/user-dto.js';
import ApiError from '../exceptions/api-error.js';
import FullUserDto from '../dto/full-user-dto.js';

export const registration = async (email, password, fullName) => {
  const candidate = await UserModel.findOne({ email });
  if (candidate) {
    throw ApiError.BadRequest(`User with email ${email} already exist`);
  }
  const hashPassword = await bcrypt.hash(password, 5);
  const activationLink = v4();

  const user = await UserModel.create({
    email,
    password: hashPassword,
    activationLink,
    fullName,
  });

  await mailService.sendActivationMail(
    email,
    `${process.env.API_URL}/api/auth/activate/${activationLink}`
  );

  const userDto = new UserDto(user);
  const tokens = tokenService.generateTokens({ ...userDto });
  await tokenService.saveToken(userDto.id, tokens.refreshToken);
  const fullUserDto = new FullUserDto(user);

  return { ...tokens, user: fullUserDto };
};

export const activate = async (activationLink) => {
  const user = await UserModel.findOne({ activationLink });
  console.log(user);
  if (!user) {
    throw ApiError.BadRequest('Activation link is not valid');
  }
  user.isActivated = true;
  await user.save();
};

export const login = async (email, password) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw ApiError.BadRequest('Incorrect email or password');
  }
  const isPassEqual = await bcrypt.compare(password, user.password);
  if (!isPassEqual) {
    throw ApiError.BadRequest('Incorrect email or password');
  }
  const userDto = new UserDto(user);
  const tokens = tokenService.generateTokens({ ...userDto });
  const fullUserDto = new FullUserDto(user);

  await tokenService.saveToken(userDto.id, tokens.refreshToken);
  return { ...tokens, user: fullUserDto };
};

export const logout = async (refreshToken) => {
  const token = await tokenService.removeToken(refreshToken);
  return token;
};

export const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw ApiError.UnauthorizedError();
  }
  const userData = tokenService.validateRefreshToken(refreshToken);
  const tokenFromDb = await tokenService.findToken(refreshToken);
  if (!userData || !tokenFromDb) {
    throw ApiError.UnauthorizedError();
  }
  const user = await UserModel.findById(userData.id);
  const userDto = new UserDto(user);
  const tokens = tokenService.generateTokens({ ...userDto });
  const fullUserDto = new FullUserDto(user);

  await tokenService.saveToken(userDto.id, tokens.refreshToken);
  return { ...tokens, user: fullUserDto };
};

export const getAllUsers = async () => {
  const users = await UserModel.find();
  return users;
};
