const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// Configure Cloudinary
cloudinary.config(process.env.CLOUDINARY_URL);
console.log("Cloudinary connected successfully");

// Define storage for images
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Check file type and set destination folder accordingly
    if (file.fieldname === "posterImg") {
      cb(null, "./public/images/posters"); // Destination folder for posters
    } else if (file.fieldname === "thumbnail") {
      cb(null, "./public/images/thumbnails"); // Destination folder for thumbnails
    } else if (file.fieldname === "profileImg") {
      cb(null, "./public/images/profile-img"); // Destination folder for profile Img
    } else if (file.fieldname === "bannerImg") {
      cb(null, "./public/images/banner"); // Destination folder for banner Img
    } else if (file.fieldname === "seasonImg") {
      cb(null, "./public/images/season"); // Destination folder for season Img
    } else {
      cb(new Error("Invalid field name"));
    }
  },
  filename: function (req, file, cb) {
    const uniqueFilename = uuidv4(); // Generate a unique filename using UUID
    cb(null, uniqueFilename + path.extname(file.originalname)); // Use the filename for the uploaded file
  },
});
const uniqueFilenameCloud = uuidv4();
const upload = multer({ storage: imageStorage });

// NEW //

async function handleImageUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    let folderName;
    switch (req.file.fieldname) {
      case "posterImg":
        folderName = "posters";
        break;
      case "thumbnail":
        folderName = "thumbnails";
        break;
      case "profileImg":
        folderName = "profile-img";
        break;
      case "bannerImg":
        folderName = "banner";
        break;
      case "seasonImg":
        folderName = "season";
        break;
      default:
        return res.status(400).json({ error: "Invalid field name" });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: folderName, // Specify the folder in Cloudinary
      public_id: uniqueFilenameCloud,
    });
    
    // Set the image URL in the Anime schema based on the fieldname
    req.imageURL = result.secure_url;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong in multer js cloudinary, may be file is missing." });
  }
}

module.exports = {
  upload,
  handleImageUpload,
};
