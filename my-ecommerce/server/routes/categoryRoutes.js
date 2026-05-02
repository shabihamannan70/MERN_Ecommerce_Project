const express = require("express");
const router = express.Router();


const {
  createCategoryController,
  updateCategoryController,
  getAllCategoryController,
  deleteCategoryController,
} = require("../controllers/categoryController");


const { requireSignIn, isAdmin } = require("../middleware/authMiddleware");


router.post(
  "/create-category",
  requireSignIn,
  isAdmin,
  createCategoryController
);


router.get("/get-category", getAllCategoryController);


router.put(
  "/update-category/:id", 
  requireSignIn, 
  isAdmin, 
  updateCategoryController
);


router.delete(
  "/delete-category/:id",
  requireSignIn,
  isAdmin,
  deleteCategoryController
);

module.exports = router;