import { Router } from 'express';

import { CommentsController } from '../../controllers/index.js';
import authMiddleware from '../../middlewares/auth-middleware.js';
import guestMiddleware from '../../middlewares/guest-middleware.js';

const router = new Router();
router.post('/', authMiddleware, CommentsController.create);
router.put('/:id', authMiddleware, CommentsController.edit);
router.delete('/:id', authMiddleware, CommentsController.remove);
router.post('/like/:id', authMiddleware, CommentsController.likeComment);
router.post(
  '/like/by-author/:id',
  authMiddleware,
  CommentsController.likeCommentByAuthor
);
router.get('/:id', guestMiddleware, CommentsController.getComments);

router.post('/replies', authMiddleware, CommentsController.createReply);
router.put('/replies/:id', authMiddleware, CommentsController.editReply);
router.delete('/replies/:id', authMiddleware, CommentsController.removeReply);
router.post('/replies/like/:id', authMiddleware, CommentsController.likeReply);
router.post(
  '/replies/like/by-author/:id',
  authMiddleware,
  CommentsController.likeReplyByAuthor
);
router.get('/replies/:id', guestMiddleware, CommentsController.getReplies);

export default router;
