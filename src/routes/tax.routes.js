import express from 'express';
import * as controller from '../controllers/tax.controller.js';
import validate from '../middlewares/validate.js';
import { yearQuery } from '../models/common.model.js';

const router = express.Router();

router.get('/income', validate(yearQuery, 'query'), controller.income);

export default router;
