import jwt from "jsonwebtoken"
import User from "../models/user.models.js"

export const protect=async(req,res,next)=>{
    try{
        const token = req.headers.authorization?.startsWith('Bearer ') 
        ? req.headers.authorization.split(' ')[1] 
        : null;
  
      if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
      }

      const decoded=jwt.verify(token,"varad");
      console.log("decoded",decoded);
      const user=await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ error: 'User no longer exists' });
      }
  
      // 4. Attach user to request
      req.user = user;
      next();
    }catch(error){
        console.error('Authentication error:', error.message);
    }
}