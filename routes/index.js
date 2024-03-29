const dotenvResult = require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("./userDetailsdata");
const Request = require("./pendingrequest");
const AdminRequest = require("./adminRequest");
const moment = require("moment");
const ResetToken = require("./resetToken");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const crypto = require("crypto");
// const jsonwebtoken = require("jsonwebtoken");
router.use(express.urlencoded({ extended: false }));

console.log(dotenvResult, "Checking");

const sendResetPasswordMail = async (name, email, token) => {
  try {
    // Create transporter for nodemailer
    const transporter = nodemailer.createTransport({
      host: "server51.a2zcreatorz.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.USER_EMAIL, // Update with your email
        pass: process.env.USER_PASSWORD, // Update with your email password
      },
    });

    // Define email content
    const mailOptions = {
      from: process.env.USER_EMAIL, // Update with your email
      to: email,
      subject: "Reset your password",
      html: `<h1>Hello ${name}</h1>
        <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click on the following link to reset your password:</p>
        <p><a href="http://localhost:3000/resetPassword?token=${token}">Reset Password</a></p>
        <p>Sincerely,</p>
        <p>Bitdefender Team</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Failed to send reset password email:", error);
        throw new Error("Failed to send reset password email");
      } else {
        console.log("Reset password email sent:", info.response);
      }
    });
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to send reset password email");
  }
};

router.post("/register", async (req, res) => {
  const { name, email, password, mobileNo, department } = req.body;
  console.log(req.body);
  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    console.log(existingUser);
    if (existingUser) {
      return res
        .status(400)
        .json({ status: "error", message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user instance without verification token
    const newUser = new User({
      name,
      email,
      mobileNo,
      department,
      hashedPassword,
    });
    console.log(newUser, "New User");

    // Save the new user to the database
    await newUser.save();

    // Respond with success message
    return res.status(200).json({
      status: "success",
      message: "User created successfully.",
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

router.post("/verify-email", async (req, res) => {
  const { token } = req.body;
  try {
    // Find the user by verification token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "Invalid verification token" });
    }

    // Update user's emailVerified status to true
    user.emailVerified = true;
    user.verificationToken = undefined; // Clear verification token
    await user.save();

    // Respond with success message
    return res
      .status(200)
      .json({ status: "success", message: "Email verified successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set in the environment.");
  process.exit(1); // Exit the script if JWT_SECRET is not set
}
const jwtSecret = process.env.JWT_SECRET.trim(); // Remove leading and trailing whitespace
console.log(jwtSecret, "key");
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    console.log("User Found:", user); // Log the user object for debugging
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ status: "error", message: "Wrong password" });
    }

    // Generate JWT token upon successful login
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "2h",
    });

    // Prepare user data to be sent along with the token
    const userData = {
      name: user.name,
      email: user.email,
      mobileNo: user.mobileNo,
      department: user.department,
    };

    // Respond with success message, token, and user data
    res.status(200).json({ status: "success", token, userData });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const authenticateUser = (req, res, next) => {
  const authHeader = req.header("Authorization");
  console.log(authHeader, "asdasd");
  console.log(req.header, "aasd");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized: Missing or valid token",
    });
  }
  const token = authHeader.split(" ")[1]; // Extract token without "Bearer " prefix
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // Attach user object to request
    console.log(decoded, "dasd");
    next();
  } catch (error) {
    console.error("Error:", error);
    res.status(401).json({ status: "error", message: "Invalid token" });
  }
};

router.post("/CreateUserData", authenticateUser, async (req, res) => {
  const {
    CompanyName,
    CompanyAddress,
    ContactPerson,
    ContactNo,
    Email,
    UserEmail,
    ProductName,
    NumberOfLicense,
    TotalLicense,
    TotalPrice,
    DateOfIssuance,
    DateOfExpiry,
    AccountManagerName,
  } = req.body;
  console.log(req.body, "checking data");
  try {
    // const UserEmail = req.user.email; // Retrieve user's email from authenticated user
    const CreatedAt = Date.now(); // Get current date and time

    const newRequest = await Request.create({
      CompanyName: CompanyName,
      CompanyAddress: CompanyAddress,
      ContactPerson: ContactPerson,
      ContactNo: ContactNo,
      Email: Email,
      ProductName: ProductName,
      NumberOfLicense: NumberOfLicense,
      TotalLicense: TotalLicense,
      TotalPrice: TotalPrice,
      DateOfIssuance: DateOfIssuance,
      DateOfExpiry: DateOfExpiry,
      AccountManagerName: AccountManagerName,
      UserEmail: UserEmail,
      CreatedAt: CreatedAt,
    });

    res.status(200).json({
      status: "success",
      message: "User data created successfully",
      newRequest,
    });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to create user data" });
  }
});

router.get("/pendingRequests", authenticateUser, async (req, res) => {
  try {
    const pendingRequests = await Request.find();
    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch pending requests" });
  }
});

router.get("/approvedrequest", async (req, res) => {
  try {
    // Fetch approved requests from the database
    const approveRequest = await AdminRequest.find({ status: "approved" });
    const today = new Date(); // Current date
    const thirtyDaysLater = new Date(today); // 30 days later from today
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30); // Add 30 days to today's date

    for (let i = 0; i < approveRequest.length; i++) {
      const expiryDate = new Date(approveRequest[i].DateOfExpiry);
      const daysLeft = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 30 && daysLeft >= 0) {
        approveRequest[
          i
        ].Message = `Your license will expire in ${daysLeft} days.`;
      }
    }

    res.status(200).json(approveRequest);
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch approve requests" });
  }
});
router.post("/approveRequest/:id", async (req, res) => {
  // Check if the user is allowed to approve requests
  const {
    CompanyName,
    CompanyAddress,
    ContactPerson,
    ContactNo,
    Email,
    UserEmail,
    ProductName,
    NumberOfLicense,
    TotalLicense,
    TotalPrice,
    DateOfIssuance,
    DateOfExpiry,
    AccountManagerName,
  } = req.body;

  try {
    // Find the user by email
    // var email = UserEmail;
    const user = await User.findOne({ email: UserEmail });
    console.log("User Found:", user);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    if (user.department !== "Admin") {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to approve requests",
      });
    }

    // Proceed with request approval logic
    const { id } = req.params;
    console.log(id, "checking id");

    // Add the request to the AdminRequest collection with the "approved" status and additional data
    const adminRequestData = {
      approvedBy: user.email, // Use user's email from the database
      rejectedBy: "",
      CompanyName: CompanyName,
      CompanyAddress: CompanyAddress,
      ContactPerson: ContactPerson,
      ContactNo: ContactNo,
      Email: Email,
      UserEmail: UserEmail,
      ProductName: ProductName,
      NumberOfLicense: NumberOfLicense,
      TotalLicense: TotalLicense,
      TotalPrice: TotalPrice,
      DateOfIssuance: DateOfIssuance,
      DateOfExpiry: DateOfExpiry,
      AccountManagerName: AccountManagerName,
      Message: "",
      status: "approved",
      dateNow: moment().format("YYYY-MM-DD"),
      time: moment().format("HH:mm:ss"),
      requestId: id,
    };

    await AdminRequest.create(adminRequestData);
    await Request.findByIdAndDelete(id);

    // Send success response with the ID of the approved order
    res.status(200).json({
      status: "success",
      message: "Request approved successfully",
      orderId: id,
      orderStatus: "approved",
      adminEmail: user.email,
    });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to approve request" });
  }
});

router.get("/rejectedRequests", async (req, res) => {
  try {
    // Fetch rejected requests from the database
    const rejectedRequests = await AdminRequest.find({ status: "rejected" });
    res.status(200).json(rejectedRequests);
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch rejected requests" });
  }
});

router.post("/rejectRequest/:id", async (req, res) => {
  const { id } = req.params;
  const {
    CompanyName,
    CompanyAddress,
    ContactPerson,
    ContactNo,
    Email,
    UserEmail,
    ProductName,
    NumberOfLicense,
    TotalLicense,
    TotalPrice,
    DateOfIssuance,
    DateOfExpiry,
    AccountManagerName,
  } = req.body;
  // var email = UserEmail;
  try {
    const user = await User.findOne({ email: UserEmail });
    console.log(UserEmail, "Checking email reject");
    console.log("User Found:", user); // Log the user object for debugging
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    if (user.department !== "Admin") {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to approve requests",
      });
    }
    // Update the request status to "rejected" in the database
    const findRequest = await AdminRequest.findOne({ requestId: id });
    if (!findRequest) {
      const adminRequestData = {
        approvedBy: "",
        rejectedBy: email,
        CompanyName: CompanyName,
        CompanyAddress: CompanyAddress,
        ContactPerson: ContactPerson,
        ContactNo: ContactNo,
        Email: Email,
        UserEmail: UserEmail,
        ProductName: ProductName,
        NumberOfLicense: NumberOfLicense,
        TotalLicense: TotalLicense,
        TotalPrice: TotalPrice,
        DateOfIssuance: DateOfIssuance,
        DateOfExpiry: DateOfExpiry,
        AccountManagerName: AccountManagerName,
        status: "rejected",
        dateNow: moment().format("YYYY-MM-DD"),
        time: moment().format("HH:mm:ss"),
        requestId: id,
      };
      await AdminRequest.create(adminRequestData);
    } else {
      await AdminRequest.findOneAndUpdate(
        { requestId: id },
        {
          status: "rejected",
          rejectedBy: email,
          dateNow: moment().format("YYYY-MM-DD"),
          time: moment().format("HH:mm:ss"),
        }
      );
    }

    await Request.findByIdAndDelete(id);
    // Send success response with the ID of the rejected order
    res.status(200).json({
      status: "success",
      message: "Request rejected successfully",
      requestId: id,
      status: "rejected",
      rejectedBy: email,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to reject and delete request",
    });
  }
});
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // If user doesn't exist, return error
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    // Generate a random string for reset token
    const resetToken = randomstring.generate();

    // Update user's reset token in the database
    await User.updateOne({ email }, { $set: { token: resetToken } });

    // Send reset password instructions email
    await sendResetPasswordMail(user.name, user.email, resetToken);
    // Respond with success message
    res.status(200).json({
      status: "success",
      message: "Reset password instructions sent to your email",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to process forgot password request",
    });
  }
});

router.get("/resetPassword/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).send("Invalid or expired token");
    }

    res.render("index", { token });
  } catch (error) {
    console.error("Error", error);
    res.status(500).send("Interval server error");
  }
});

router.post("/resetPassword", async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;
  try {
    // Find user by reset token
    const user = await User.findOne({ token });

    // If user doesn't exist or token is invalid, return error
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid or expired token" });
    }
    // const isPasswordValid = await bcrypt.compare(user.hashedPassword);
    // if (!isPasswordValid) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Old password is incorrect" });
    // }
    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and clear reset token
    user.hashedPassword = hashedPassword;
    user.token = null;
    await user.save();

    // Send response
    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to reset password" });
  }
});

router.get("/resetPassword", async (req, res) => {
  const token = req.query.token || req.params.token; // Extract the token from the query parameters
  try {
    // Find the user associated with the token in the database
    const user = await User.findOne({ token });
    if (!user) {
      // If no user is found, respond with a 404 error
      return res.status(404).send("Invalid or expired token");
    }

    // Render a page where the user can reset their password
    res.render("index", { token }); // Assuming you have a view named "resetPassword"
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
});
module.exports = router;
