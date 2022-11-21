import { Router } from 'express';
import { body } from 'express-validator';

import { UserController } from '../../controllers/index.js';
import authMiddleware from '../../middlewares/auth-middleware.js';
import { registerValidation } from '../../validations/validations.js';

const router = new Router();

router.post('/registration', registerValidation, UserController.registration);
router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
router.get('/activate/:link', UserController.activate);
router.get('/refresh', UserController.refresh);
router.get('/users', authMiddleware, UserController.getUsers);
router.post('/update', authMiddleware, UserController.updateData);

export default router;
