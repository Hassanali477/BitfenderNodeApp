const mongoose = require("mongoose");

const adminRequestSchema = new mongoose.Schema({
  CompanyName: String,
  CompanyAddress: String,
  ContactPerson: String,
  ContactNo: Number,
  Email: String,
  UserEmail: String,
  ProductName: String,
  NumberOfLincense: Number,
  TotalLicense: Number,
  TotalPrice: Number,
  DateOfIssuance: String,
  DateOfExpiry: String,
  AccountManagerName: String,
  Message: String,
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
