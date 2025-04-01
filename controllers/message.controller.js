import Message from '../models/message.models.js';
import Room from '../models/room.models.js';

// Send message to room (with Socket.io broadcast)
export const sendMessage = async (req, res) => {
  try {
    const { content, roomId } = req.body;
    const userId = req.user._id;

    // 1. Verify user is a room participant
    const room = await Room.findById(roomId);
    if (!room.participants.includes(userId)) {
      return res.status(403).json({ error: 'Not a room participant' });
    }

    // 2. Create and save message
    const message = new Message({
      content,
      room: roomId,
      sender: userId
    });
    await message.save();

    // 3. Populate sender details
    const populatedMessage = await Message.populate(message, {
      path: 'sender',
      select: 'username avatar'
    });

    // 4. Broadcast via Socket.io (if available)
    if (req.io) {
      req.io.to(roomId.toString()).emit('newMessage', populatedMessage);
    }

    // 5. Return response
    res.status(201).json(populatedMessage);

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get room messages (optimized query)
export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { before = Date.now(), limit = 100 } = req.query;

    // 1. Validate room access
    const room = await Room.findById(roomId);
    if (!room.participants.includes(req.user._id)) {
      return res.status(403).json({ error: 'Not a room participant' });
    }

    // 2. Fetch messages with cursor-based pagination
    const messages = await Message.find({
      room: roomId,
      createdAt: { $lt: new Date(parseInt(before)) }
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'username avatar')
      .lean();

    // 3. Return chronological order (oldest first)
    res.json(messages.reverse());

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Delete message (with Socket.io notification)
export const deleteMessage = async (req, res) => {
  try {
    // 1. Find message (only sender can delete)
    const message = await Message.findOneAndDelete({
      _id: req.params.messageId,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    // 2. Broadcast deletion
    if (req.io) {
      req.io.to(message.room.toString()).emit('messageDeleted', {
        messageId: message._id,
        deletedBy: req.user._id
      });
    }

    // 3. Return success
    res.json({ 
      success: true,
      message: 'Message deleted'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};