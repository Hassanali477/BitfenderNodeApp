const mongoose = require("mongoose");

// const connectionString = "mongodb://127.0.0.1:27017/BitfenderApp";
const connectionString =
  "mongodb+srv://hasanali:S9q02eGWUmas7ZVR@bitfendernodeapp.oqtniqj.mongodb.net/bitfendernodeapp?retryWrites=true&w=majority&appName=bitfendernodeapp";

mongoose
  .connect(connectionString)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

const UserSchema = mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  mobileNo: Number,
  department: String,
  password: String,
});

module.exports = mongoose.model("User", UserSchema);
