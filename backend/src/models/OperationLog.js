// src/models/OperationLog.js
import mongoose from "mongoose";

const opLogSchema = new mongoose.Schema({
  prompt: String,
  action: Object,
  result: Object,
  createdAt: { type: Date, default: Date.now },
});

const OperationLog =
  mongoose.models.OperationLog || mongoose.model("OperationLog", opLogSchema);

export default OperationLog;
