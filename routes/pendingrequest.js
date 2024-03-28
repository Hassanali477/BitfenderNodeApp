const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  CompanyName: String,
  CompanyAddress: String,
  ContactPerson: String,
  ContactNo: Number,
  Email: String,
  UserEmail: String, 
  ProductName: String,
  NumberOfLicense: Number,
  TotalLicense: Number,
  TotalPrice: Number,
  DateOfIssuance: String,
  DateOfExpiry: String,
  AccountManagerName: String,
  CreatedAt: { type: Date, default: Date.now }, // Add CreatedAt field with default value set to current date and time
});

module.exports = mongoose.model("Request", requestSchema);
