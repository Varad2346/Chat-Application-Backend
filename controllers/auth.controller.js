import User from "../models/user.models.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export const register=async(req,res)=>{

    try{
        console.log(req.body);
        const {username,password}=req.body;
        
        if(!username||!password){
            return res.status(400).json({error:'username and password are required'})
        }
        if(password.length<6){
            return res.status(400).json({error:'password at least 6 characters'})
        }
        
        const existingUser=await User.findOne({username});
        if(existingUser){
            return res.status(409).json({error:'User already exists!'})
        }
        const salt=await bcrypt.genSalt(10);
        const hashPassword=await bcrypt.hash(password,salt);
        
        const newUser=new User({
            username,
            password:hashPassword,
            rooms:[]
        });
        await newUser.save();
        
        const token=jwt.sign({
            id:newUser._id,
            username:newUser.username
        },"varad",{
            expiresIn:'1d'
        })
        
        res.status(201).json({
            message: 'User registered successfully',
            user: newUser,
            token
        });
    }catch(error){
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
}

export const login=async(req,res)=>{

    try{
        const {username,password}=req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
          }
      
          const user = await User.findOne({ username }).select('+password'); // Explicitly include password
          if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
          }
          console.log(user.password);
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
          }
          console.log("isM",isMatch)
          const token = jwt.sign(
            { id: user._id, username: user.username },
            "varad",
            { expiresIn: "1d" }
          );

          res.json({
            message: "Login successful",
            user: user,
            token,
            expiresIn: 24 * 60 * 60  // 1 day in seconds
          });

    }catch(error){
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error during login" });
    }
}

export const getUsers=async(req,res)=>{
    try{
        const users=await User.find();
        res.status(201).json({"success":true,users:users});
        console.log(users);
    }catch(error){
        console.log(error);
    }
}