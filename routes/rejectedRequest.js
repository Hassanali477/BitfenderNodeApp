const mongoose = require("mongoose");

const RejectRequestSchema = new mongoose.Schema({
  CompanyName: String,
  CompanyAddress: String,
  ContactPerson: String,
  ContactNo: Number,
  UserEmail: String,
  Email: String,
  ProductName: String,
  NumberOfLincense: Number,
  TotalLicense: Number,
  TotalPrice: Number,
});
const RejectRequest = mongoose.model("RejectRequest", RejectRequestSchema);

module.exports = RejectRequest;
