const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = 'msw_secret_key_123';

app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mswenterprisespk@gmail.com',
        pass: process.env.EMAIL_PASS
    }
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, '../frontend/index.html')); 
});

// Assets folder ke liye bhi path set karein (Zaroori hai)
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Uploads backend mein hi rahega

const dbURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/msw_enterprises'; 
mongoose.connect(dbURI)
    .then(async () => {
        console.log("MongoDB Connected");
        const adminExists = await Admin.findOne({ username: 'msw_admin' });
        if (!adminExists) {
            const hash = await bcrypt.hash('msw_password', 10);
            await new Admin({ username: 'msw_admin', password: hash, email: 'mswenterprisespk@gmail.com' }).save();
            console.log("Default Admin Created");
        }
    }).catch(err => console.log(err));

const adminSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    email: { type: String, default: 'mswenterprisespk@gmail.com' },
    resetOTP: String, otpExpires: Date
});
const Admin = mongoose.model('Admin', adminSchema);

const userSchema = new mongoose.Schema({
    fullName: String, email: { type: String, unique: true },
    contact: String, city: String, address: String, password: String,
    resetOTP: String, otpExpires: Date
});
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
    title: String, description: String, price: Number, discount: Number,
    shippingFee: { type: Number, default: 0 },
    stock: { type: Number, default: 10 },
    sold: { type: Number, default: 0 },
    weight: { type: String, default: '' },
    images: [String],
    video: String
});
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
    customer_details: Object, cart_items: Array, total_bill: Number,
    status: { type: String, default: 'Seller to Pack' },
    order_id: String, user_id: String,
    created_at: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }
});

const cpUpload = upload.fields([{ name: 'productImages', maxCount: 5 }, { name: 'productVideo', maxCount: 1 }]);

const verifyToken = (req, res, next) => {
    const token = req.headers['auth-token'];
    if (!token) return res.status(401).json({ success: false });
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) { res.status(400).json({ success: false }); }
};

// ================= API ROUTES =================

// 1. ADD PRODUCT
app.post('/api/admin/add-product', cpUpload, async (req, res) => {
    try {
        const { title, description, price, stock, shippingFee, salePrice, weight } = req.body;

        let originalPrice = Number(price) || 0;
        let finalSalePrice = Number(salePrice) || 0;
        let calculatedDiscount = 0;

        if (finalSalePrice > 0 && finalSalePrice < originalPrice) {
            calculatedDiscount = Math.round(((originalPrice - finalSalePrice) / originalPrice) * 100);
        }

        let imagePaths = [];
        if (req.files && req.files['productImages']) {
            imagePaths = req.files['productImages'].map(file => file.path);
        }

        let videoPath = '';
        if (req.files && req.files['productVideo']) {
            videoPath = req.files['productVideo'][0].path;
        }

        const newProduct = new Product({
            title, description,
            price: Number(price) || 0,
            discount: Number(calculatedDiscount) || 0,
            stock: Number(stock) || 0,
            shippingFee: Number(shippingFee) || 0,
            weight: weight || "0",
            images: imagePaths,
            video: videoPath
        });

        await newProduct.save();
        res.json({ success: true, message: "Product Added Successfully" });

    } catch (err) {
        console.error("Add Product Error:", err);
        res.status(500).json({ success: false, message: "Server Error: " + err.message });
    }
});

// 2. UPDATE PRODUCT
app.put('/api/admin/product/:id', cpUpload, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        const { title, description, price, stock, shippingFee, salePrice, weight } = req.body;

        let originalPrice = Number(price) || 0;
        let finalSalePrice = Number(salePrice) || 0;
        let calculatedDiscount = 0;

        if (finalSalePrice > 0 && finalSalePrice < originalPrice) {
            calculatedDiscount = Math.round(((originalPrice - finalSalePrice) / originalPrice) * 100);
        }

        let updateData = {
            title, description,
            price: Number(price) || 0,
            discount: Number(calculatedDiscount) || 0,
            stock: Number(stock) || 0,
            shippingFee: Number(shippingFee) || 0,
            weight: weight || "0"
        };

        if (req.files && req.files['productImages']) {
            updateData.images = req.files['productImages'].map(file => file.path);
        }
        if (req.files && req.files['productVideo']) {
            updateData.video = req.files['productVideo'][0].path;
        }

        await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ success: true, message: "Product Updated" });

    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// 3. DELETE PRODUCT
app.delete('/api/admin/product/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false });
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Deleted" });
    } catch (err) { res.status(500).json({ success: false }); }
});

// 4. GET PRODUCTS
app.get('/api/products', async (req, res) => {
    try { const p = await Product.find(); res.json(p); } catch (e) { res.status(500).json([]); }
});

app.get('/api/product/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid ID" });
        const p = await Product.findById(req.params.id);
        if (!p) return res.status(404).json({ message: "Not Found" });
        res.json(p);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

// --- AUTH ROUTES ---
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin || !(await bcrypt.compare(password, admin.password))) return res.json({ success: false, message: "Invalid Credentials" });
    const token = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET);
    res.json({ success: true, token });
});

app.post('/api/user/signup', async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);
        await new User({ ...req.body, password: hash }).save();
        res.json({ success: true });
    } catch (e) { res.status(400).json({ success: false, message: "Email exists" }); }
});

app.post('/api/user/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.json({ success: false, message: "Invalid Credentials" });
    const token = jwt.sign({ id: user._id, name: user.fullName }, JWT_SECRET);
    res.json({ success: true, token, user });
});

// --- RECOVERY ROUTES ---
app.post('/api/user/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.json({ success: false, message: "User not found" });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOTP = otp; user.otpExpires = Date.now() + 600000;
        await user.save();
        await transporter.sendMail({
            from: '"MSW Support" <mswenterprisespk@gmail.com>', to: email,
            subject: 'Reset Password', html: `<h3>OTP: ${otp}</h3>`
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/user/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await User.findOne({ email, resetOTP: otp, otpExpires: { $gt: Date.now() } });
        if (!user) return res.json({ success: false, message: "Invalid OTP" });
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetOTP = undefined; user.otpExpires = undefined;
        await user.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/forgot-password', async (req, res) => {
    const { username } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (!admin) return res.json({ success: false });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        admin.resetOTP = otp; admin.otpExpires = Date.now() + 600000;
        await admin.save();
        await transporter.sendMail({
            from: '"MSW Admin" <mswenterprisespk@gmail.com>', to: admin.email,
            subject: 'Admin OTP', html: `<h3>OTP: ${otp}</h3>`
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/reset-password', async (req, res) => {
    const { username, otp, newPassword } = req.body;
    try {
        const admin = await Admin.findOne({ username, resetOTP: otp, otpExpires: { $gt: Date.now() } });
        if (!admin) return res.json({ success: false, message: "Invalid OTP" });
        admin.password = await bcrypt.hash(newPassword, 10);
        admin.resetOTP = undefined; admin.otpExpires = undefined;
        await admin.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

// --- ORDER ROUTES ---
app.post('/api/order/place', verifyToken, async (req, res) => {
    try {
        const count = await Order.countDocuments();
        const order_id = `${String(count + 1).padStart(2, '0')}${new Date().getMonth() + 1}${new Date().getFullYear()}`;
        const newOrder = new Order({ user_id: req.user.id, order_id, ...req.body });
        await newOrder.save();
        if (req.body.cart_items) {
            for (const item of req.body.cart_items) {
                if (item.id) await Product.findByIdAndUpdate(item.id, { $inc: { stock: -item.quantity, sold: item.quantity } });
            }
        }
        res.json({ success: true, message: "Order Placed", orderId: order_id });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/order/cancel/:id', verifyToken, async (req, res) => {
    try {
        const order = await Order.findOne({ order_id: req.params.id, user_id: req.user.id });
        if (!order) return res.json({ success: false });
        if (order.status !== 'Pending' && order.status !== 'Seller to Pack') return res.json({ success: false, message: "Too late to cancel" });
        order.status = 'Cancelled';
        await order.save();
        if (order.cart_items) {
            for (const item of order.cart_items) {
                if (item.id) await Product.findByIdAndUpdate(item.id, { $inc: { stock: item.quantity, sold: -item.quantity } });
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.get('/api/user/orders', verifyToken, async (req, res) => {
    const orders = await Order.find({ user_id: req.user.id }).sort({ created_at: -1 });
    res.json({ success: true, orders });
});

// --- ADMIN ROUTES ---

// UPDATE: Fetch Orders with Email Lookup
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ created_at: -1 }).lean();

        const enrichedOrders = await Promise.all(orders.map(async (order) => {

            if (!order.customer_details || !order.customer_details.email) {

                if (order.user_id) {
                    const user = await User.findById(order.user_id);
                    if (user) {
                        if (!order.customer_details) order.customer_details = {};
                        order.customer_details.email = user.email;
                    }
                }
            }
            return order;
        }));

        res.json({ success: true, orders: enrichedOrders });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, orders: [] });
    }
});

app.put('/api/admin/order/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        let order = await Order.findOneAndUpdate({ order_id: req.params.id }, { status: status }, { new: true });
        if (!order && mongoose.Types.ObjectId.isValid(req.params.id)) {
            order = await Order.findByIdAndUpdate(req.params.id, { status: status }, { new: true });
        }
        if (!order) return res.status(404).json({ success: false });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.put('/api/admin/update', verifyToken, async (req, res) => {
    try {
        const { username, newPassword } = req.body;
        const admin = await Admin.findById(req.user.id);
        if (username) admin.username = username;
        if (newPassword) admin.password = await bcrypt.hash(newPassword, 10);
        await admin.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.put('/api/user/update', verifyToken, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, req.body);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.get('/api/admin/stats', async (req, res) => {
    const earnings = await Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: "$total_bill" } } }]);
    const total = await Order.countDocuments();
    const cancelled = await Order.countDocuments({ status: 'Cancelled' });
    const pending = await Order.countDocuments({ status: 'Pending' });
    const completed = await Order.countDocuments({ status: 'Delivered' });
    const lowStock = await Product.find({ stock: { $lte: 7 } });
    res.json({
        success: true,
        total_earnings: earnings.length ? earnings[0].total : 0,
        total_orders: total, cancelled_orders: cancelled, pending_orders: pending, completed_orders: completed,
        low_stock_count: lowStock.length, low_stock_items: lowStock
    });
});

app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    try {
        await transporter.sendMail({
            from: '"MSW Contact" <mswenterprisespk@gmail.com>', to: 'mswenterprisespk@gmail.com', replyTo: email,
            subject: `Contact: ${subject}`, html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>Msg: ${message}</p>`
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));