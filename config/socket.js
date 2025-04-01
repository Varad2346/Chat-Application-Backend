import jwt from "jsonwebtoken";
import User from "../models/user.models.js";
import Message from "../models/message.models.js";
const setupSocket = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error("Authentication error");

      const decoded = jwt.verify(token, "varad");
      if (!decoded.id) throw new Error("Invalid token");

      const user = await User.findById(decoded.id);
      if (!user) throw new Error("User not found");

      socket.user = {
        id: user._id,
        username: user.username,
      };
      next();
    } catch (err) {
      console.log(err);
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Join room handler
    socket.on("joinRoom", async (roomId, username) => {
      console.log(`${username} is trying to join room ${roomId}`);
  
      // Add the socket to the specified room
      socket.join(roomId);
  
      // Fetch previous messages from the database
      try {
        const previousMessages = await Message.find({ room: roomId })
          .sort({ timestamp: 1 }) 
        socket.emit("previousMessages", previousMessages);
  
        io.to(roomId).emit("userJoined", {
          userId: socket.user.id,
          username: socket.user.username,
          message: `${username} has joined the room!`,

        });
  
        console.log(`${username} successfully joined room ${roomId}`);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    });
    socket.on("typing", (roomId, username) => {
      socket.emit("typing-user", roomId, username); // Emit typing event to other users
      console.log("typing",roomId,username);
    });
    
    socket.on("stopTyping", (roomId) => {
      socket.to(roomId).emit("stop-typing", roomId);
      console.log(roomId);// Emit stop typing event to others
    });
    
    // Message handler
    socket.on(
      "sendMessage",
      async ({ roomId, content, timestamp, username }) => {
        if (!content || content.trim().length === 0) {
          return socket.emit("error", "Message content cannot be empty");
        }
        console.log(roomId,content,timestamp,username);
        try {
          const message = await Message.create({
            senderName:username,
            content,
            room: roomId,
            sender: socket.user.id,
            sendTime:timestamp
          });
          console.log(message);
          await message.save();
          // .to(roomId)
          io.emit("receiveMessage", {
            roomId:roomId,
            _id: message._id,
            content: message.content,
            timestamp: timestamp,
            sendTime:message.sendTime,
            sender:socket.user.id,
            senderName: username,
          });
        } catch (err) {
          console.error("Message save error:", err);
        }
      }
    );

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username}`);
      // Optional: You can add room-leaving cleanup here
    });
  });
};

export default setupSocket;
