const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const runSeeder = async () => {
  try {
    console.log("Seeder process started...");

  
    const demoUsers = [
      {
        name: "Super Admin",
        email: "admin10@gmail.com",
        password: "admin123",
        role: 1,
      },
      {
        name: "Manager Admin",
        email: "manager@gmail.com",
        password: "manager123",
        role: 1,
      },
      {
        name: "General User",
        email: "user@gmail.com",
        password: "user123",
        role: 0, 
      }
    ];

    for (const u of demoUsers) {
   
      const hashedPassword = await bcrypt.hash(u.password, 10);

      
      await User.findOneAndUpdate(
        { email: u.email },
        { 
          name: u.name,
          email: u.email,
          password: hashedPassword,
          role: u.role 
        },
        { 
          upsert: true, 
          new: true, 
          setDefaultsOnInsert: true 
        }
      );
      console.log(`Successfully Processed: ${u.email} | Role: ${u.role}`);
    }

    console.log(`-----------------------------------`);
    console.log(`ALL DEMO USERS CREATED SUCCESSFULLY!`);
    console.log(`-----------------------------------`);
    console.log(`Login Credentials for Postman:`);
    console.log(`1. admin10@gmail.com | admin123 (Admin)`);
    console.log(`2. manager@gmail.com  | manager123 (Admin)`);
    console.log(`3. user@gmail.com     | user123 (General User)`);
    console.log(`-----------------------------------`);

    process.exit();
  } catch (error) {
    console.error("Error in seeder:", error.message);
    process.exit(1);
  }
};

runSeeder();