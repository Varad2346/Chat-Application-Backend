import express from 'express';
import {
  sendMessage,
  getMessages,
  deleteMessage
} from '../controllers/message.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// POST /api/messages - Send new message
router.post('/', sendMessage);

// GET /api/messages/:roomId - Get messages for a room
router.get('/:roomId', getMessages);

// DELETE /api/messages/:messageId - Delete a message
router.delete('/:messageId', deleteMessage);

export default router;