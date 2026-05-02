const Product = require("../models/Product");
const slugify = require("slugify");


const createProductController = async (req, res) => {
  try {
    const { name, category, manufactureDate, productDetails } = req.body;


    if (!req.file) {
      return res.status(400).send({ success: false, message: "Product image is required" });
    }


    if (!name || !category || !manufactureDate || !productDetails) {
      return res.status(400).send({
        success: false,
        message: "All fields are required",
      });
    }

    const product = new Product({
      name,
      slug: slugify(name),
      category,
      manufactureDate,
      image: req.file.filename,
      productDetails: JSON.parse(productDetails), 
    });

    await product.save();


    const io = req.app.get('socketio');
    if (io) {
      io.emit("newProduct", product);
    }

    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in creating product",
    });
  }
};


const getProductController = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("category")
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      countTotal: products.length,
      message: "All Products List",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error while getting products",
    });
  }
};


const getSingleProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate("category");

    if (!product) {
      return res.status(404).send({ success: false, message: "Product not found" });
    }

    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error while getting single product",
    });
  }
};


const updateProductController = async (req, res) => {
  try {
    const { name, category, manufactureDate, productDetails } = req.body;
    const { id } = req.params;

    let updateData = {
      name,
      slug: name ? slugify(name) : undefined,
      category,
      manufactureDate,
    };

    if (productDetails) {
     
      updateData.productDetails = JSON.parse(productDetails);
    }

    if (req.file) {
      updateData.image = req.file.filename;
    }

    
    const product = await Product.findByIdAndUpdate(id, updateData, { new: true }).populate("category");

    if (!product) {
      return res.status(404).send({ success: false, message: "Product not found" });
    }


    const io = req.app.get('socketio');
    if (io) {
   
      io.emit("productUpdate", product);
      
    
      if (product.productDetails) {
        product.productDetails.forEach(variant => {
          io.emit("stockUpdate", { 
            variantId: variant._id, 
            newStock: Number(variant.quantity) 
          });
        });
      }
    }

    res.status(200).send({
      success: true,
      message: "Product Updated Successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error while updating product",
    });
  }
};


const deleteProductController = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).send({ success: false, message: "Product not found" });
    }

    res.status(200).send({
      success: true,
      message: "Product Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error while deleting product",
    });
  }
};

module.exports = {
  createProductController,
  getProductController,
  getSingleProductController,
  updateProductController,
  deleteProductController,
};