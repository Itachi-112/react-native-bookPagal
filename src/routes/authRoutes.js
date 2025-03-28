import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import protectRoute from "../middleware/auth.middleware.js";


const router = express.Router();

const generateToken = (userId) => {
   return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

router.post("/register", async (req, res) => {
   try {
      const { email, username, password } = req.body;
      if (!email || !username || !password) {
         return res.status(400).json({ message: "All fields are required" });
      }

      if (password.lentgh < 6) {
         return res.status(400).json({ message: "Password should be at least 6 character long" })
      }
      if (username.lentgh < 3) {
         return res.status(400).json({ message: "Username should be at least 4 character long" })
      }

      // checking if user already exists

      const existingEmail = await User.findOne({ email });

      if (existingEmail) {
         return res.status(400).json({ message: "Email already exists" })
      }

      const existingUsername = await User.findOne({ username });

      if (existingUsername) {
         return res.status(400).json({ message: "Username already exists" })
      }

      // get random avatar
      const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`

      const user = new User({
         email,
         username,
         password,
         profileImage
      });

      await user.save();

      const token = generateToken(user._id);

      res.status(201).json({
         token,
         user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
         },
      });

   }
   catch (error) {
      console.log("Error in registration route", error);
      res.status(500).json({
         message: "Internal server error"
      })
   }
});
router.post("/login", async (req, res) => {
   try {
      const { email, password } = req.body;

      if (!email || !password) return res.status(400).json({ message: "All fields are required" });

      //checking if user already exists

      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Invalid credentials" });

      // checking if the password is correct

      const isPassCorrect = await user.comparePassword(password);

      if (!isPassCorrect) return res.status(400).json({ message: "Invalid credentials" })
      const token = generateToken(user._id);

      res.status(200).json({
         token,
         user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage
         }
      });
   }
   catch (error) {
console.log("Error in login route", error)
res.status(500).json("Internal server error")
   }
});


export default router;