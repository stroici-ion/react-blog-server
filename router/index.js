import { Router } from 'express';

import userRouter from './routes/user-router.js';
import postsRouer from './routes/posts-router.js';
import tagsRouter from './routes/tags-router.js';
import commentsRouter from './routes/comments-router.js';
import { UserController } from '../controllers/index.js';

const router = new Router();

router.use('/auth', userRouter);
router.use('/users', UserController.getUsers);
router.use('/posts', postsRouer);
router.use('/tags', tagsRouter);
router.use('/comments', commentsRouter);

export default router;
