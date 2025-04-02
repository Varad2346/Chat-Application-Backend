import mongoose from "mongoose"

const connectDB=async()=>{
    try{
        await mongoose.connect("mongodb+srv://varadlimbkar:xHiB4SCvappd1MPw@cluster0.3cvlquq.mongodb.net/mern-chat",{
          })
        console.log("MongoDB connected")  
    }catch(error){
        console.log("MongoDB conncetion error",error);
        process.exit(1);
    }
}

export default connectDB;