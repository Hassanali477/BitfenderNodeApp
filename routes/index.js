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
        <p><a href="http://localhost:3000/resetPassword?token=/${token}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p>Sincerely,</p>
        <p>Bitdefender Team</p>`,
    };

    // Send mail
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
router.get("/", (req, res) => {
  res.send("Hello Node");
});

router.post("/register", async (req, res) => {
  const { name, email, mobileNo, department, password } = req.body;
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
      hashedPassword, // await bcrypt.hash(password, 10),
      // emailVerified: true, // Set emailVerified to true since we're skipping verification
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

// Function to send verification email
// async function sendVerificationEmail(email, verificationToken) {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
// auth: {
//   user: process.env.EMAIL_USER,
//   pass: process.env.EMAIL_PASSWORD,
// },
//     });

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Email Verification",
//       html: `<p>Please click <a href="http://your_backend_domain/verify-email?token=${verificationToken}">here</a> to verify your email.</p>`,
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.error("Failed to send verification email:", error);
//         throw new Error("Failed to send verification email");
//       } else {
//         console.log("Verification email sent:", info.response);
//       }
//     });
//   } catch (error) {
//     console.error("Error sending verification email:", error);
//     throw new Error("Failed to send verification email");
//   }
// }

// POST route for verifying email
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
  const { ProductName, ClientName, NumberOfUsers, ContactNo, ProductPrice } =
    req.body;
  try {
    // const UserEmail = req.user.email; // Retrieve user's email from authenticated user
    const TotalPrice = NumberOfUsers * ProductPrice; // Calculate total price
    const CreatedAt = Date.now(); // Get current date and time

    const newRequest = await Request.create({
      ProductName: ProductName,
      ClientName: ClientName,
      NumberOfUsers: NumberOfUsers,
      ContactNo: ContactNo,
      ProductPrice: ProductPrice,
      CreatedAt: CreatedAt,
      TotalPrice: TotalPrice,
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

// router.get("/pendingRequests", authenticateUser, async (req, res) => {
//   try {
//     const pendingRequests = await AdminRequest.find({ status: "pending" });
//     res.status(200).json(pendingRequests);
//   } catch (error) {
//     console.error("Error:", error);
//     res
//       .status(500)
//       .json({ status: "error", message: "Failed to fetch pending requests" });
//   }
// });
// get approve request
router.get("/approvedrequest", async (req, res) => {
  try {
    // Fetch rejected requests from the database
    const approveRequest = await AdminRequest.find({ status: "approved" });
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
    email,
    ProductName,
    ClientName,
    NumberOfUsers,
    ContactNo,
    ProductPrice,
  } = req.body;

  const user = await User.findOne({ email });
  console.log("User Found:", user); // Log the user object for debugging
  if (!user) {
    return res.status(404).json({ status: "error", message: "User not found" });
  }

  // if (req.user.role !== "Admin") {
  //   return res.status(403).json({
  //     status: "error",
  //     message: "You are not authorized to approve requests",
  //   });
  // }
  if (user.department !== "Admin") {
    return res.status(403).json({
      status: "error",
      message: "You are not authorized to approve requests",
    });
  }

  // Proceed with request approval logic
  const { id } = req.params;
  console.log(id, "checking id");
  // const { email } = req.user;
  try {
    // Update the request status to "approved" in the database
    // await Request.findByIdAndUpdate(id, { approvedBy: email });
    // Add the request to the AdminRequest collection with the "approved" status and additional data
    const adminRequestData = {
      approvedBy: email,
      rejectedBy: "",
      ProductName: ProductName,
      ClientName: ClientName,
      NumberOfUsers: NumberOfUsers,
      ContactNo: ContactNo,
      ProductPrice: ProductPrice,
      status: "approved",
      dateNow: moment().format("YYYY-MM-DD"),
      time: moment().format("HH:mm:ss"),
      requestId: id,
    };
    await AdminRequest.create(adminRequestData);
    // Delete the request from the database
    await Request.findByIdAndDelete(id);
    // Send success response with the ID of the approved order
    res.status(200).json({
      status: "success",
      message: "Request approved successfully",
      orderId: id,
      orderStatus: "approved",
      adminEmail: email,
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
    email,
    ProductName,
    ClientName,
    NumberOfUsers,
    ContactNo,
    ProductPrice,
  } = req.body;
  try {
    const user = await User.findOne({ email });
    console.log("User Found:", user); // Log the user object for debugging
    // if (!user) {
    //   return res
    //     .status(404)
    //     .json({ status: "error", message: "User not found" });
    // }
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
        ProductName: ProductName,
        ClientName: ClientName,
        NumberOfUsers: NumberOfUsers,
        ContactNo: ContactNo,
        ProductPrice: ProductPrice,
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
    // Add the request to the AdminRequest collection with the "rejected" status and additional data
    // const adminRequestData = {
    //   ...req.body,
    //   status: "rejected",
    //   date: moment().format("YYYY-MM-DD"),
    //   time: moment().format("HH:mm:ss"),
    //   requestId: id,
    // };
    // await AdminRequest.create(adminRequestData);
    // Delete the request from the database
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
// Forgot password route
// router.post("/forgot-password", async (req, res) => {
//   const { email } = req.body;

//   // Check if the email is null or empty
//   if (!email) {
//     return res
//       .status(400)
//       .json({ status: "error", message: "Email is required" });
//   }
//   // Validate email format
//   if (!isValidEmail(email)) {
//     return res
//       .status(400)
//       .json({ status: "error", message: "Invalid email format" });
//   }
//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ status: "error", message: "User not found" });
//     }

//     const resetToken = crypto.randomBytes(20).toString("hex");

//     console.log("Reset token:", resetToken); // Log the generated reset token

//     // Check if there's already a reset token for this email
//     let existingResetToken = await ResetToken.findOne({ email });

//     // If there's an existing reset token, update it with the new token and reset the expiration time
//     if (existingResetToken) {
//       existingResetToken.token = resetToken;
//       existingResetToken.createdAt = new Date(); // Reset the expiration time
//       await existingResetToken.save();
//     } else {
//       // If there's no existing reset token, create a new one
//       await ResetToken.create({
//         userId: user._id,
//         email: user.email,
//         token: resetToken,
//         createdAt: createdAt,
//       });
//     }

//     console.log("Reset token created successfully");

//     // Send the reset password instructions email with the reset token
//     await sendResetPasswordEmail(user.email, resetToken);

//     console.log("Reset password instructions email sent");

//     res.status(200).json({
//       status: "success",
//       message: "Reset password instructions sent to your email",
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({
//       status: "error",
//       message: "Failed to process forgot password request",
//     });
//   }
// });

// // Function to validate email format
// function isValidEmail(email) {
//   // Regular expression for basic email format validation
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// }

// async function sendResetPasswordEmail(email, token) {
//   const transporter = nodemailer.createTransport({
//     host: "smtp.ethereal.email",
//     port: 587, // Fixed port number
//     secure: true,
//     auth: {
//       user: "ewell13@ethereal.email",
//       pass: "X7yMkpH1c5duvJzrB1",
//     },
//     EnableSsl: true,
//   });

//   const info = await transporter.sendMail({
//     from: '"Hasan Ali" <ewell13@ethereal.email>',
//     to: email,
//     subject: "Resetting password",
//     text: "Hello, here is your password reset token: " + token,
//   });
//   console.log("Message sent: %s", info.messageId);
//   console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
// }

// // Reset password route
// router.post("/reset-password", async (req, res) => {
//   const { token, newPassword } = req.body;
//   try {
//     const resetToken = await ResetToken.findOne({ token });
//     if (!resetToken) {
//       return res
//         .status(404)
//         .json({ status: "error", message: "Invalid or expired token" });
//     }

//     const user = await User.findById(resetToken.userId);
//     if (!user) {
//       return res
//         .status(404)
//         .json({ status: "error", message: "User not found" });
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     user.hashedPassword = hashedPassword;
//     await user.save();

//     // Delete the reset token from the database after password reset
//     await ResetToken.findByIdAndDelete(resetToken._id);

//     res
//       .status(200)
//       .json({ status: "success", message: "Password reset successfully" });
//   } catch (error) {
//     console.error("Error:", error);
//     res
//       .status(500)
//       .json({ status: "error", message: "Failed to reset password" });
//   }
// });

// router.post("/forgot-password", async (req, res) => {
//   const { email } = req.body;
//   try {
//     const oldUser = await User.findOne({ email });
//     if (!oldUser) {
//       return res.status(404).json({ message: "User not exist" });
//     }
//     const secret = JWT_SECRET + oldUser.hashedPassword;
//     const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
//       expiresIn: "2m",
//     });
//     const link = `http://localhost:3000/reset-password/${oldUser._id}/${token}`;
//     var transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: "hassanmarwat326@gmail.com",
//         pass: "marwat123",
//       },
//     });

//     var mailOptions = {
//       from: "hassanmarwat326@gmail.com",
//       to: email,
//       subject: "Reset Password",
//       text: link,
//     };

//     transporter.sendMail(mailOptions, function (error, info) {
//       if (error) {
//         console.log(error);
//       } else {
//         console.log("Email sent: " + info.response);
//       }
//     });
//     console.log(link);
//   } catch (error) {}
// });

// router.get("/reset-password/:id/:token", async (req, res) => {
//   const { id, token } = req.params;
//   console.log(req.params, "cheking id and params");
//   const oldUser = await User.findOne({ _id: id });
//   if (!oldUser) {
//     return res.status(404).json({ message: "User not exist" });
// }
//   const secret = JWT_SECRET + oldUser.hashedPassword;
//   try {
//     const verify = jwt.verify(token, secret);
//     res.render("index", { email: verify.email });
//   } catch (error) {
//     console.log(error);
//     res.status(502).json({ message: "Not verfied" });
//   }
// });

// router.post("/reset-password/:id/:token", async (req, res) => {
//   const { id, token } = req.params;
//   const { password } = req.body;
//   const oldUser = await User.findOne({ _id: id });
//   if (!oldUser) {
//     return res.status(404).json({ message: "User not exist" });
//   }
//   const secret = JWT_SECRET + oldUser.password;
//   try {
//     const verify = jwt.verify(token, secret);
//     const encryptedPassword = await bcrypt.hash(password[0], 10);
//     console.log(password, "checking verify");
//     await User.updateOne(
//       {
//         _id: id,
//       },
//       {
//         $set: {
//           password: encryptedPassword,
//         },
//       }
//     );

//     res.send("Password updated");
//   } catch (error) {
//     console.log(error, "asdasd");
//     res.status(500).json({ status: "Error updating password" });
//   }
// });

// router.get("/forgot-password", async (req, res) => {
//   try {
//     const email = req.body.email;
//     const userData = User.findOne({ email: email });
//     if (userData) {
//       const randomString = randomstring.generate();

//       User.updateOne({ email: email }, { $set: { token: randomString } });
//       sendResetPasswordMail(userData.name, userData.email, randomstring);
//       res.status(400).send({ success: true, msg: "This email is not exist" });
//     } else {
//       res
//         .status(400)
//         .send({ success: true, msg: "Please check your inbox mail and " });
//     }
//   } catch (error) {
//     res.status(400).send({ success: false, msg: error.message });
//   }
// });
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
router.get("/resetPassword", async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      const password = req.body.password;
      const newPassword = await bcrypt.hash(password);
      const userData = await User.findByIdAndUpdate(
        { _id: tokenData._id },
        {
          $set: {
            password: newPassword,
            token: " ",
          },
        },
        { new: true }
      );
      res
        .status(200)
        .send({
          success: false,
          msg: "User password has been reset!",
          data: userData,
        });
    } else {
      res
        .status(200)
        .send({ success: true, msg: "This link has been expired." });
    }
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

module.exports = router;
