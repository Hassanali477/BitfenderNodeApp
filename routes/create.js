const mongoose = require("mongoose");

const CreateUserSchema = new mongoose.Schema(
  {
    CompanyName: String,
    CompanyAddress: String,
    ContactPerson: String,
    ContactNo: Number,
    Email: String,
    UserEmail: String, // Ensure UserEmail field is included
    ProductName: String,
    NumberOfLicense: Number,
    TotalLicense: Number,
    TotalPrice: Number,
    DateOfIssuance: String,
    DateOfExpiry: String,
    AccountManagerName: String,
  },
  {
    collection: "UserCreate",
  }
);

module.exports = mongoose.model("UserCreate", CreateUserSchema);
