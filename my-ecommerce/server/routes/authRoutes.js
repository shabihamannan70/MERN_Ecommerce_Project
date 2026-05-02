const express = require("express");
const router = express.Router();


const { requireSignIn, isAdmin } = require("../middleware/authMiddleware"); 


const { 
    registerController, 
    loginController 
} = require("../controllers/authController"); 

const { 
    placeOrderController, 
    getAllOrdersController 
} = require("../controllers/orderController"); 




router.post("/register", registerController);

router.post("/login", loginController);

router.post("/place-order", requireSignIn, placeOrderController);

router.get("/all-orders", requireSignIn, isAdmin, getAllOrdersController);


module.exports = router;