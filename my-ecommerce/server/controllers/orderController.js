const orderModel = require("../models/orderModel");
const productModel = require("../models/Product");


const placeOrderController = async (req, res) => {
  try {
    const { cart, paymentMethod, totalAmount, shippingAddress, shippingCharge } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).send({ success: false, message: "Cart is empty" });
    }

  
    const formattedProducts = cart.map((item) => ({
      productId: item.productId || item._id,
      name: item.name,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price),
      color: item.color || "N/A",
      material: item.material || "N/A"
    }));


    const order = await new orderModel({
      products: formattedProducts,
      paymentMethod,
      buyer: req.user._id,
      totalAmount: Number(totalAmount),
      shippingCharge: Number(shippingCharge), 
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        deliveryArea: shippingAddress.location 
      }
    }).save();

   
    const stockUpdates = [];
    for (const item of cart) {
      const product = await productModel.findOneAndUpdate(
        { 
          _id: item.productId, 
          "productDetails._id": item.variantId 
        },
        { 
          $inc: { "productDetails.$.quantity": -item.quantity } 
        },
        { new: true }
      );

      if (product) {
        
        const updatedVariant = product.productDetails.find(
          (v) => v._id.toString() === item.variantId.toString()
        );
        
        if (updatedVariant) {
          stockUpdates.push({
            variantId: item.variantId,
            newStock: updatedVariant.quantity
          });
        }
      }
    }


    const io = req.app.get('socketio');
    if (io) {

      const fullOrder = await orderModel.findById(order._id).populate("buyer", "name email");
      io.emit("newOrder", fullOrder);


      io.emit("cartClear", { buyerId: req.user._id });


      stockUpdates.forEach((update) => {
        io.emit("stockUpdate", update);
      });
    }

    res.status(201).send({ 
        success: true, 
        message: "Order Placed Successfully", 
        order 
    });

  } catch (error) {
    console.error("Order Error:", error.message);
    res.status(500).send({ success: false, message: error.message });
  }
};


const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("buyer", "name email")
      .populate({ path: "products.productId", model: "Product", select: "name image" })
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

module.exports = { placeOrderController, getAllOrdersController };