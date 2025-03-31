import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// --- create a recommendation ---
router.post("/", protectRoute, async (req, res) => {
    // ... (your existing code for creating a book) ...
     try{

        const {title,caption,image,rating} = req.body;
        if(!image||!title||!caption||!rating) return res.status(400).json({message:"Please provide all the fields"});

        //upload image to cloudinary
        const uploadResponse  = await cloudinary.uploader.upload(image);
        const imageUrl = uploadResponse.secure_url;
        // saving the image to the database

        const newBook = new Book({
            title,
            caption,
            rating,
            image: imageUrl,
            user: req.user._id
        })

        await newBook.save();

        res.status(201).json(newBook)


    }catch(error){
        console.log("Error creating book",error);
        res.status(500).json({message:error.message})
    }
});


// --->>> ADD THIS MISSING ROUTE HANDLER <<<---
// --- get ALL books with pagination ---
router.get("/", protectRoute, async (req, res) => {
    try {
        // Pagination setup
        const page = parseInt(req.query.page) || 1; // Ensure page is a number, default 1
        const limit = parseInt(req.query.limit) || 10; // Ensure limit is a number, default 10
        const skip = (page - 1) * limit;

        // Get total count for pagination calculation (efficiently)
        const totalBooksCount = await Book.countDocuments(); // Get total count

        // Fetch paginated books
        const books = await Book.find() // Find all books
            .sort({ createdAt: -1 })  // Sort by creation date
            .skip(skip)               // Apply skip for pagination
            .limit(limit)             // Apply limit for pagination
            .populate("user", "username profileImage"); // Populate user details

        // Send response with books and pagination info
        res.status(200).json({ // Use .json() for consistency
            books,
            currentPage: page,
            totalPages: Math.ceil(totalBooksCount / limit) // Calculate total pages correctly
        });

    } catch (error) {
        console.error("Error getting all books:", error); // Log error
        res.status(500).json({ message: "Internal server error fetching books" }); // Send error response
    }
});
// --->>> END OF ADDED ROUTE HANDLER <<<---


// --- get books by user ---
router.get("/user", protectRoute, async (req, res) => {
    // ... (your existing, corrected code for getting user's books) ...
     try {
        // Optional but good practice: Check if user info is available
        if (!req.user || !req.user._id) {
            console.error("User info missing in /user route after protectRoute");
            return res.status(401).json({ message: "User context not found" });
        }

        const books = await Book.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(books); // Send books if found successfully

    } catch (error) {
        console.error(`Error getting books for user ${req.user?._id}:`, error.message);
        res.status(500).json({ message: "Server error fetching user books" });
    }
});


// --- delete a book ---
router.delete("/:id", protectRoute, async (req, res) => {
    // ... (your existing code for deleting a book) ...
     try{
         const book = await Book.findById(req.params.id);

         if(!book) return res.status(404).json({message:"Book not found"});
         //check if the user is the owner of the book
         if(book.user.toString() !== req.user._id.toString())
            return res.status(401).json({message:"Unauthorized"});

         // delete image from cloudinary
        if(book.image && book.image.includes("cloudinary")) {
            try{
                const publicId = book.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            }
          catch (error) {
            console.log("Error deleting image from cloudinary", error);
          }
        }

         await book.deleteOne();
         res.json({message:"Book deleted"}); // Or status 204 No Content
    }
    catch(error){
        console.log("Error deleting book",error);
        res.status(500).json({message:"Internal server error"})
    }
});



export default router;