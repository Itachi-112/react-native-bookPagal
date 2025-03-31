import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";


const router = express.Router();

// create a recommendation

router.post("/",protectRoute, async (req,res)=>{
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

// get books by user
router.get("/user", protectRoute, async (req, res) => {
    try {
        // Optional but good practice: Check if user info is available
        if (!req.user || !req.user._id) {
            console.error("User info missing in /user route after protectRoute");
            return res.status(401).json({ message: "User context not found" });
        }

        const books = await Book.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(books); // Send books if found successfully

    } catch (error) { // --->>> FIX: Catch block now handles the error <<<---
        // Log the error message (or the full error object for more detail)
        console.error(`Error getting books for user ${req.user?._id}:`, error.message); // Now 'error' exists here
        // Send a 500 status and error message back to the client
        res.status(500).json({ message: "Server error fetching user books" });
    }
    // --->>> REMOVE the lines that were outside the try...catch <<<---
});
// delete a book
router.delete("/:id", protectRoute, async (req, res) => {
   

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
         res.json({message:"Book deleted"});
    }
    catch(error){
        console.log("Error deleting book",error);
        res.status(500).json({message:"Internal server error"})
    }

});



export default router;