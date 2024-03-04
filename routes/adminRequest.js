const mongoose = require("mongoose");

const adminRequestSchema = new mongoose.Schema({
  ProductName: String,
  ClientName: String,
  NumberOfUsers: Number,
  ContactNo: Number,
  UserEmail: String,
  ProductPrice: Number,
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  rejectedBy: String,
  approvedBy: String,
  dateNow: String,
  time: String,
  requestId: String,
});

module.exports = mongoose.model("AdminRequest", adminRequestSchema);
