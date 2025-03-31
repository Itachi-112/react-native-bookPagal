import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (req, res, next) => {

    try {
        //get token 
        const token = req.header("Authorization").replace("Bearer ", "");

        //verify token
        if (!token) return res.status(401).json({ message: "No token found, access denied" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //find user by id
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) return res.status(401).json({ message: "Invalid token, user not found" });

        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication error", error);
        res.status(401).json({ message: "Invalid token, access denied" });
    }
};

export default protectRoute;