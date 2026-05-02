const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireSignIn, isAdmin } = require("../middleware/authMiddleware");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); 
  }
});


const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only (.jpg, .png, .webp) !"));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, 
  fileFilter: fileFilter
});


const {
  createProductController,
  getProductController,
  getSingleProductController,
  updateProductController,
  deleteProductController,
} = require("../controllers/productController");


router.post(
  "/create-product", 
  requireSignIn, 
  isAdmin, 
  upload.single('image'), 
  createProductController
);


router.get("/get-product", getProductController);


router.get("/get-product/:id", getSingleProductController);


router.put(
  "/update-product/:id", 
  requireSignIn, 
  isAdmin, 
  upload.single('image'), 
  updateProductController
);


router.delete("/delete-product/:id", requireSignIn, isAdmin, deleteProductController);

module.exports = router;