const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserDetailSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    mobileNo: Number,
    department: String,
    hashedPassword: String,
    is_Admin: Number,
    token: {
      type: String,
      default: "",
    },
  },
  {
    collection: "UsersInfo",
  }
);

// Pre-save hook to hash the password before saving to the database
UserDetailSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.hashedPassword = hashedPassword;
    return next();
  } catch (error) {
    return next(error);
  }
});

module.exports = mongoose.model("UsersInfo", UserDetailSchema);
