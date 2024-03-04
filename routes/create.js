const mongoose = require("mongoose");

const CreateUserSchema = new mongoose.Schema(
  {
    ProductName: String,
    ClientName: String,
    NumberOfUsers: Number,
    ContactNo: Number,
    ProductPrice: Number,
  },
  {
    collection: "UserCreate",
  }
);

module.exports = mongoose.model("UserCreate", CreateUserSchema);
