const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        quantity: Number,
        price: Number,
        color: String,
        material: String,
      },
    ],
    buyer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    paymentMethod: { type: String, default: "COD" },
    

    shippingAddress: {
        name: String,
        phone: String,
        address: String,
        
        deliveryArea: { 
            type: String, 
            enum: ["inside", "outside"] 
        }
    },
    
   
    shippingCharge: {
        type: Number,
        default: 0
    },
    
    status: {
      type: String,
      default: "Not Process",
      enum: ["Not Process", "Processing", "Shipped", "Delivered", "Cancel"],
    },
    totalAmount: Number,
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);