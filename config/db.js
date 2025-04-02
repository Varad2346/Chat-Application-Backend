import mongoose from "mongoose"
import dotenv from 'dotenv';

dotenv.config();

const connectDB=async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/mern-chat`,{
          })
        console.log("MongoDB connected")  
    }catch(error){
        console.log("MongoDB conncetion error",error);
        process.exit(1);
    }
}

export default connectDB;