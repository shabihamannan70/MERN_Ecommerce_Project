const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http'); 
const { Server } = require('socket.io'); 
const connectDB = require('./config/db'); 


dotenv.config();


connectDB();

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const server = http.createServer(app);


const io = new Server(server, {
    pingTimeout: 60000, 
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"], 
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});


app.set('socketio', io);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);


app.get('/', (req, res) => {
    res.send("<h1 style='text-align:center; margin-top:50px;'>ShopHub Real-time Server is Running! 🚀</h1>");
});


io.on('connection', (socket) => {
    console.log(`✅ Socket Connected: ${socket.id}`);

    
    socket.on('setup', (userData) => {
        if(userData?._id) {
            socket.join(userData._id);
            console.log(`👤 User joined room: ${userData._id}`);
            socket.emit('connected');
        }
    });

   
    socket.on("stockUpdate", (data) => {
        // data = { variantId, newStock }
        console.log(`📦 Broadcast: Variant ${data.variantId} stock is now ${data.newStock}`);
        io.emit("stockUpdate", data); 
    });

    
    socket.on("newOrder", (newOrder) => {
        console.log("🔔 New Order Received, broadcasting to Admin...");
        io.emit("newOrder", newOrder); 
    });

  
    socket.on("productUpdate", (updatedProduct) => {
        console.log("📢 Product Info Updated:", updatedProduct.name);
        io.emit("productUpdate", updatedProduct);
    });

    
    socket.on("newProduct", (product) => {
        io.emit("newProduct", product);
    });

    
    socket.on('disconnect', () => {
        console.log(`❌ Socket Disconnected: ${socket.id}`);
    });
});


const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`--------------------------------------------------`);
    console.log(`🚀 Server running on port: ${PORT}`);
    console.log(`🌐 Live URL: http://localhost:${PORT}`);
    console.log(`🛠️ Socket.io is active and monitoring connections`);
    console.log(`--------------------------------------------------`);
});


process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console.log("Shutting down the server due to Unhandled Promise Rejection");
    server.close(() => process.exit(1));
});