import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import { apiLimiter, authLimiter } from '../middlewares/rateLimit.js';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import categoryRoutes from './category.routes.js';
import transactionRoutes from './transaction.routes.js';
import taxRoutes from './tax.routes.js';
import complianceRoutes from './compliance.routes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use(apiLimiter);

// Public
router.use('/auth', authLimiter, authRoutes);

// Everything below requires a valid access token
router.use(authenticate);
router.use('/profile', profileRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/tax', taxRoutes);
router.use('/compliance', complianceRoutes);

export default router;
