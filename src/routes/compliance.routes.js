import express from 'express';
import * as controller from '../controllers/compliance.controller.js';
import validate from '../middlewares/validate.js';
import { yearQuery } from '../models/common.model.js';

const router = express.Router();

router.get('/deadlines', validate(yearQuery, 'query'), controller.deadlines);

export default router;
