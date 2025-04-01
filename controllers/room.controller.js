import User from "../models/user.models.js";
import Room from "../models/room.models.js";

export const createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const creatorId = req.user._id;
    console.log(name);
    // Validation
    if (!name || name.length < 3) {
      return res.status(400).json({ 
        success: false,
        error: "Room name must be at least 3 characters" 
      });
    }

    // Check for existing room
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(409).json({ 
        success: false,
        error: "Room name already exists" 
      });
    }

    // Create new room (creator auto-added via pre-save hook)
    const newRoom = new Room({
      name,
      creator: creatorId,
      participants: [creatorId] // Include creator by default
    });

    await newRoom.save();

    // Update creator's room list
    await User.findByIdAndUpdate(creatorId, {
      $addToSet: { rooms: newRoom._id }
    });

    // Prepare response data
    const responseData = {
      _id: newRoom._id,
      name: newRoom.name,
      participants: await User.find({ _id: { $in: newRoom.participants } })
        .select('username _id'),
      createdAt: newRoom.createdAt
    };

    // Broadcast room creation (if using Socket.io)
    if (req.io) {
      req.io.emit('newRoomCreated', responseData);
    }

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: responseData
    });

  } catch (error) {
    console.error("Room creation error:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error during room creation" 
    });
  }
};

export const addParticipants = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userIds } = req.body;
    const currentUserId = req.user._id;
    console.log(userIds);
    console.log(roomId);
    // Input validation
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Valid array of user IDs required"
      });
    }

    // Find room and verify ownership
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found"
      });
    }

    if (room.creator.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Only room creator can add participants"
      });
    }

    // Find valid users to add (not already in room)
    const validUsers = await User.find({
      _id: { $in: userIds }
    }).select('_id username');
    console.log(validUsers);
    if (validUsers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid new users to add"
      });
    }

    // Update room participants
    const newParticipantIds = validUsers.map(user => user._id);
    room.participants = [...new Set([...room.participants, ...newParticipantIds])];
    await room.save();

    // Update all added users' room lists
    await User.updateMany(
      { _id: { $in: newParticipantIds } },
      { $addToSet: { rooms: roomId } }
    );

    // Broadcast participant addition
    if (req.io) {
      req.io.to(roomId).emit('participantsAdded', {
        roomId,
        addedParticipants: validUsers,
        addedBy: req.user.username
      });
    }

    res.json({
      success: true,
      message: "Participants added successfully",
      data: {
        roomId: room._id,
        addedCount: validUsers.length,
        newParticipants: validUsers,
        totalParticipants: room.participants.length
      }
    });

  } catch (error) {
    console.error("Add participants error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while adding participants"
    });
  }
};

export const getRoom = async (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized - User not authenticated" });
    }

    // Find all rooms and populate creator details
    const rooms = await Room.find().populate('creator', 'username _id'); // Adjust fields as needed

    // Format response with room details and ownership status
    const formattedRooms = rooms.map(room => ({
      id: room._id,
      name: room.name,
      createdAt: room.createdAt,
      isCreator: room.creator._id.equals(req.user._id), // Proper ObjectId comparison
      participants:room.participants,
      creator: {
        id: room.creator._id,
        username: room.creator.username
      }
    }));

    res.status(200).json({
      success: true,
      rooms: formattedRooms
    });

  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};