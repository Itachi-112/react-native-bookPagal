import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";


const router = express.Router();

// create a recommendation

router.post("/",protectRoute, async (req,res)=>{
    try{

        const {title,description,image,rating} = req.body;
        if(!image||!title||!description||!rating) return res.status(400).json({message:"Please provide all the fields"});

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

router.get("/",protectRoute, async (req,res)=>{
    
    try{

        // pagination
const page = req.query.page || 1;
const limit = req.query.limit || 5;
const skip = (page - 1) * limit;


        const books = await Book.find()
        .sort({createdAt:-1})  //sort by creation date in descending order
        .skip(skip)
        .limit(limit)
        .populate("user","username profileImage") ; 

        res.send(
            {
                books,
                currentPage: page,
                totalBooks: books.length,
                totalPages: Math.ceil(books.length / limit)
            }
        );
    }

    catch(error){
        console.log("Error getting books",error);
        res.status(500).json({message:"Internal server error"})
    }

});

// get books by user 
router.get("/user",protectRoute, async (req,res)=>{
    
try{
const books = await Book.find({user: req.user._id}).sort({createdAt:-1});
res.json(books);
}
catch(error){}
console.error("Error getting books",error.message);
res.status(500).json({message:"Server error"})
})

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