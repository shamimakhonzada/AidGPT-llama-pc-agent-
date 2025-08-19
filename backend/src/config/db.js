import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aidgpt", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(" MongoDB Connected");
  } catch (error) {
    console.error(" MongoDB Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
