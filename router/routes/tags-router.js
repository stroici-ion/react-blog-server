import { Router } from 'express';

import { TagsController } from '../../controllers/index.js';

const router = new Router();

router.get('/', TagsController.getPopular);

export default router;
