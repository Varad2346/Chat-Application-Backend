import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: []
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-add creator to participants
roomSchema.pre("save", function(next) {
  if (!this.participants.includes(this.creator)) {
    this.participants.push(this.creator);
  }
  next();
});

export default mongoose.model("Room", roomSchema);