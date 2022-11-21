import { Router } from 'express';

import { PostController } from '../../controllers/index.js';
import { handleValidationErrors } from '../../utils/index.js';
import { postCreateValidation } from '../../validations/validations.js';
import guestMiddleware from '../../middlewares/guest-middleware.js';
import authMiddleware from '../../middlewares/auth-middleware.js';

const router = new Router();

router.get('/', guestMiddleware, PostController.getAll);
router.get('/:id', guestMiddleware, PostController.getOne);
router.get('/multimedia/:id', guestMiddleware, PostController.getOneMultimedia);
router.post(
  '/',
  authMiddleware,
  postCreateValidation,
  handleValidationErrors,
  PostController.create
);
router.post(
  '/pin-comment/:id',
  authMiddleware,
  PostController.togglePinnedComment
);
router.delete('/:id', authMiddleware, PostController.remove);
router.patch(
  '/:postId',
  authMiddleware,
  postCreateValidation,
  handleValidationErrors,
  PostController.update
);

router.post(
  '/multimedia/like/:id',
  authMiddleware,
  PostController.likeMultimedia
);
router.post('/like/:id', authMiddleware, PostController.likePost);

export default router;
