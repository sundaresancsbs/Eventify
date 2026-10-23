import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: { service: 'eventify-api', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }
  });
});

export default router;
