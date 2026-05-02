const Category = require("../models/Category");
const slugify = require("slugify");


const createCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).send({ message: "Category is required" });
    

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(200).send({ success: false, message: "This category is already created" });
    }

    const category = await new Category({ 
        name, 
        slug: slugify(name, { lower: true }) 
    }).save();

    res.status(201).send({ success: true, message: "New category is created", category });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, error: error.message, message: "Category creating is failed" });
  }
};


const getAllCategoryController = async (req, res) => {
  try {
    const category = await Category.find({});
    res.status(200).send({ success: true, message: "All category", category });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, error: error.message, message: "Can't find Category" });
  }
};

const updateCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;


    const category = await Category.findByIdAndUpdate(
      id,
      { name, slug: slugify(name, { lower: true }) },
      { new: true } 
    );

    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Can't find Category",
      });
    }

    res.status(200).send({
      success: true,
      message: "Category Updated Successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error while updating category",
    });
  }
};


const deleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.status(200).send({ success: true, message: "Category Deleted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, error: error.message, message: "Category Delete Failed" });
  }
};

module.exports = {
  createCategoryController,
  updateCategoryController,
  getAllCategoryController,
  deleteCategoryController,
};