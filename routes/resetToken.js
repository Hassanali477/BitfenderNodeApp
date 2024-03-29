const mongoose = require("mongoose");

const resetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 3600, // Token expires in 1 hour (optional)
  },
});


const ResetToken = mongoose.model("ResetToken", resetTokenSchema);

module.exports = ResetToken;
