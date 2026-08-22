import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Ensure Cloudinary is configured using the CLOUDINARY_URL environment variable
// which should look like: cloudinary://api_key:api_secret@cloud_name
cloudinary.config({
  secure: true
});

export default cloudinary;
