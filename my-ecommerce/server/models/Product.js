const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    
    
    image: {
        type: String,
        required: [true, "Product image is required"]
    },

   
    manufactureDate: {
        type: Date,
        required: [true, "Manufacture date is required"]
    },
    
    
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    
    
    productDetails: [
        {
            material: String,
            dimensions: String,
            color: String,
            price: Number,
            
            quantity: {
                type: Number,
                default: 0
            }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);