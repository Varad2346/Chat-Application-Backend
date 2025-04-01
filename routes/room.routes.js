import express from "express";
import { createRoom,addParticipants, getRoom } from "../controllers/room.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(protect); // All routes require authentication

router.post("/", protect,createRoom);
router.get("/get", protect,getRoom);
router.put('/:roomId/participants',protect, addParticipants);

export default router;