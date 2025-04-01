dotenv.config();
import express, { urlencoded } from "express";
import cors from "cors";
import http from 'http';
import { Server } from 'socket.io'; // Add this import
import connectDB from "./config/db.js";
import dotenv from 'dotenv';
import authRouter from "./routes/auth.routes.js";
import roomRoutes from "./routes/room.routes.js";
import messageRoutes from "./routes/message.routes.js";
import setupSocket from "./config/socket.js"; // New socket setup file
const app = express();
app.use(cors());

const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "https://chat-application-frontend-livid.vercel.app/" ,
    methods:["GET","POST"],
    allowedHeaders: ["Content-Type", "Authorization"],

  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Routes
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});
console.log("hi")
// Initialize Socket.io
setupSocket(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});