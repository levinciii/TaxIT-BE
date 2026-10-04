import express from 'express';
import * as controller from '../controllers/transaction.controller.js';
import validate from '../middlewares/validate.js';
import { idParam } from '../models/common.model.js';
import { transactionInputSchema, transactionQuerySchema } from '../models/transaction.model.js';

const router = express.Router();

router.get('/', validate(transactionQuerySchema, 'query'), controller.list);
router.post('/', validate(transactionInputSchema), controller.create);
router.put('/:id', validate(idParam, 'params'), validate(transactionInputSchema), controller.update);
router.delete('/:id', validate(idParam, 'params'), controller.remove);

export default router;
