import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - supports both students and admins
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  university: text("university"),
  role: text("role").notNull().default("student"), // "student" or "admin"
  isVerified: boolean("is_verified").default(false),
  campusLocation: text("campus_location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["student", "admin"]).default("student"),
}).omit({ id: true, createdAt: true });

export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Products/Listings table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  condition: text("condition").notNull(),
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("active"), // "active", "sold", "removed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products, {
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  category: z.enum(["textbooks", "electronics", "clothing", "furniture", "sports"]),
  condition: z.enum(["new", "like-new", "good", "fair", "vintage"]),
  location: z.string().min(1),
  imageUrl: z.string().nullable().optional(),
}).omit({ id: true, userId: true, status: true, createdAt: true, updatedAt: true });

export const selectProductSchema = createSelectSchema(products);
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Conversations table
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  buyerId: varchar("buyer_id").references(() => users.id).notNull(),
  sellerId: varchar("seller_id").references(() => users.id).notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({ 
  id: true, 
  createdAt: true,
  lastMessageAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages, {
  content: z.string().min(1),
}).omit({ id: true, createdAt: true, isRead: true });

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Reports table for admin moderation
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  reporterId: varchar("reporter_id").references(() => users.id).notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "reviewed", "resolved"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports, {
  reason: z.string().min(5),
  status: z.enum(["pending", "reviewed", "resolved"]).default("pending"),
}).omit({ id: true, createdAt: true });

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Payment methods (for storing user payment info)
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  last4: text("last4").notNull(),
  brand: text("brand").notNull(),
  expiryMonth: integer("expiry_month").notNull(),
  expiryYear: integer("expiry_year").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods, {
  last4: z.string().length(4),
  brand: z.string(),
  expiryMonth: z.coerce.number().min(1).max(12),
  expiryYear: z.coerce.number().min(24).max(99),
}).omit({ id: true, userId: true, isDefault: true, createdAt: true });

export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;

// Transactions table (for purchase history)
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").references(() => users.id).notNull(),
  sellerId: varchar("seller_id").references(() => users.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"), // "pending", "completed", "cancelled", "refunded"
  paymentMethodId: varchar("payment_method_id").references(() => paymentMethods.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true, 
  createdAt: true 
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
