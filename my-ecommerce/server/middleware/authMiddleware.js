const JWT = require("jsonwebtoken");
const userModel = require("../models/User"); 


const requireSignIn = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).send({ 
        success: false, 
        message: "Token is not found, Please login !! " 
      });
    }

    
    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

   
    const decode = JWT.verify(token, process.env.JWT_SECRET);
    
    
    req.user = decode;
    next();
  } catch (error) {
    console.log("JWT Verification Error:", error.message);
    res.status(401).send({
      success: false,
      message: "Your token is not valid!!",
    });
  }
};


const isAdmin = async (req, res, next) => {
  try {
   
    const user = await userModel.findById(req.user._id);
    
    if (!user) {
      return res.status(404).send({ 
        success: false, 
        message: "User is not found!!" 
      });
    }

    
    if (user.role !== 1) { 
      return res.status(401).send({
        success: false,
        message: "Sorry, This page is for admin",
      });
    } else {
      next();
    }
  } catch (error) {
    console.log("Admin Middleware Error:", error);
    res.status(401).send({
      success: false,
      error: error.message,
      message: "Verification is failed!!",
    });
  }
};

module.exports = { requireSignIn, isAdmin };