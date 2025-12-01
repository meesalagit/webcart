import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertUserSchema, insertProductSchema, insertMessageSchema, insertReportSchema, insertPaymentMethodSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Configure multer for image uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Serve uploaded files
  app.use('/uploads', (await import('express')).default.static(uploadDir));

  // ===== IMAGE UPLOAD ROUTE =====
  app.post("/api/upload", (req, res, next) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  }, upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

  // ===== AUTHENTICATION ROUTES =====
  
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Don't return password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store user in session
      req.session.userId = user.id;
      req.session.userRole = user.role;

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // ===== PRODUCT ROUTES =====

  // Get all products with optional filters
  app.get("/api/products", async (req, res) => {
    try {
      const { category, status } = req.query;
      const products = await storage.getProducts({
        category: category as string,
        status: status as string,
      });
      res.json({ products });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get single product
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ product });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Create product (auth required)
  app.post("/api/products", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct({
        ...validatedData,
        userId,
      } as any);
      res.status(201).json({ product });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update product (auth required, owner only)
  app.patch("/api/products/:id", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.updateProduct(req.params.id, req.body);
      res.json({ product: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product (auth required, owner only)
  app.delete("/api/products/:id", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Get user's listings
  app.get("/api/users/:userId/products", async (req, res) => {
    try {
      const products = await storage.getProductsByUser(req.params.userId);
      res.json({ products });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user products" });
    }
  });

  // ===== CONVERSATION & MESSAGE ROUTES =====

  // Get user's conversations
  app.get("/api/conversations", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const conversations = await storage.getConversationsByUser(userId);
      res.json({ conversations });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Start or get conversation
  app.post("/api/conversations", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { productId, sellerId } = req.body;
      const conversation = await storage.findOrCreateConversation({
        productId,
        buyerId: userId,
        sellerId,
      });
      res.json({ conversation });
    } catch (error) {
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Get messages in conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const messages = await storage.getMessagesByConversation(req.params.id);
      res.json({ messages });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message
  app.post("/api/messages", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage({
        ...validatedData,
        senderId: userId,
      });
      res.status(201).json({ message });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ===== PAYMENT METHODS ROUTES =====

  // Get user's payment methods
  app.get("/api/payment-methods", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const paymentMethods = await storage.getPaymentMethodsByUser(userId);
      res.json({ paymentMethods });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  // Add payment method
  app.post("/api/payment-methods", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertPaymentMethodSchema.parse(req.body);
      const paymentMethod = await storage.createPaymentMethod({
        ...validatedData,
        userId,
      } as any);
      res.status(201).json({ paymentMethod });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Failed to add payment method" });
    }
  });

  // Delete payment method
  app.delete("/api/payment-methods/:id", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      await storage.deletePaymentMethod(req.params.id);
      res.json({ message: "Payment method deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payment method" });
    }
  });

  // ===== USER ROUTES =====

  // Get user by ID (public profile info only)
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Return only public info, exclude password
      const { password: _, ...publicUser } = user;
      res.json({ user: publicUser });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ===== TRANSACTION ROUTES =====

  // Get user's transactions
  app.get("/api/transactions", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const transactionList = await storage.getTransactionsByUser(userId);
      res.json({ transactions: transactionList });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Create a purchase transaction
  app.post("/api/transactions", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { productId, paymentMethodId } = req.body;

      if (!productId || !paymentMethodId) {
        return res.status(400).json({ message: "Product ID and payment method are required" });
      }

      // Use the atomic purchase method that handles all validation
      const transaction = await storage.purchaseProduct(userId, productId, paymentMethodId);

      res.status(201).json({ transaction });
    } catch (error: any) {
      console.error("Purchase error:", error);
      // Return the specific error message from storage validation
      const message = error.message || "Failed to process purchase";
      res.status(400).json({ message });
    }
  });

  // ===== ADMIN ROUTES =====

  // Get admin stats
  app.get("/api/admin/stats", async (req, res) => {
    const userRole = req.session.userRole;
    if (userRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", async (req, res) => {
    const userRole = req.session.userRole;
    if (userRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user (admin only)
  app.patch("/api/admin/users/:id", async (req, res) => {
    const userRole = req.session.userRole;
    if (userRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const user = await storage.updateUser(req.params.id, req.body);
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", async (req, res) => {
    const userRole = req.session.userRole;
    if (userRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get all products (admin only)
  app.get("/api/admin/products", async (req, res) => {
    const userRole = req.session.userRole;
    if (userRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const products = await storage.getProducts({});
      res.json({ products });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get all reports (admin only)
  app.get("/api/admin/reports", async (req, res) => {
    const userRole = req.session.userRole;
    if (userRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { status } = req.query;
      const reports = await storage.getReports(status as string);
      res.json({ reports });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Create report
  app.post("/api/reports", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport({
        ...validatedData,
        reporterId: userId,
      });
      res.status(201).json({ report });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Update report status (admin only)
  app.patch("/api/admin/reports/:id", async (req, res) => {
    const userRole = req.session.userRole;
    if (userRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { status } = req.body;
      await storage.updateReportStatus(req.params.id, status);
      res.json({ message: "Report status updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  return httpServer;
}
