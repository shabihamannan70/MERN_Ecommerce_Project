const User = require("../models/User");
const bcrypt = require("bcrypt"); 
const JWT = require("jsonwebtoken");


const registerController = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;


    if (!name || !email || !password) {
      return res.status(400).send({ message: "Please fill the input" });
    }


    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "This account already has been created!!",
      });
    }


    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await new User({
      name,
      email,
      password: hashedPassword,
      role: role || 0, 
    }).save();

    res.status(201).send({
      success: true,
      message: "Registration is successfull!!",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Registration is failed!!",
      error: error.message,
    });
  }
};


const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).send({ message: "Please give email and password" });
    }


    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "This email is not registered!! ",
      });
    }


    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Wrong password, Please try again!!",
      });
    }


    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).send({
      success: true,
      message: "Login is succed!!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Login failed!!",
      error: error.message,
    });
  }
};

module.exports = { registerController, loginController };