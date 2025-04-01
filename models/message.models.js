import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true
  },
  senderName:{
    type:String,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sendTime:{
    type:String
  }
});

// Index for faster room message queries
messageSchema.index({ room: 1, timestamp: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;