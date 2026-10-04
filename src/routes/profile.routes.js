import express from 'express';
import * as controller from '../controllers/profile.controller.js';
import validate from '../middlewares/validate.js';
import { profileSchema } from '../models/profile.model.js';

const router = express.Router();

router.get('/', controller.get);
router.put('/', validate(profileSchema), controller.update);

export default router;
