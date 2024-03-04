const mongoose = require("mongoose");

const RejectRequestSchema = new mongoose.Schema({
  ProductName: {
    type: String,
    required: true,
  },
  ClientName: {
    type: String,
    required: true,
  },
  NumberOfUsers: {
    type: Number,
    required: true,
  },
  ContactNo: {
    type: String,
    required: true,
  },
  ProductPrice: {
    type: Number,
    required: true,
  },
  // UserEmail: {
  //   type: String,
  //   required: true,
  // },
  CreatedAt: {
    type: Date,
    default: Date.now,
  },
  TotalPrice: {
    type: Number,
    required: true,
  },
  // RejectionReason: {
  //   type: String,
  //   required: true,
  // },
});
const RejectRequest = mongoose.model("RejectRequest", RejectRequestSchema);

module.exports = RejectRequest;
