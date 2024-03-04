const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  ProductName: String,
  ClientName: String,
  NumberOfUsers: Number,
  ContactNo: Number,
  ProductPrice: Number,
  // UserEmail: String, // Add UserEmail field
  CreatedAt: { type: Date, default: Date.now }, // Add CreatedAt field with default value set to current date and time
  TotalPrice: Number, // Add TotalPrice field
});

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;
