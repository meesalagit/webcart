import { 
  users, 
  products, 
  conversations, 
  messages, 
  reports,
  paymentMethods,
  transactions,
  type User, 
  type InsertUser,
  type Product,
  type InsertProduct,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Report,
  type InsertReport,
  type PaymentMethod,
  type InsertPaymentMethod,
  type Transaction,
  type InsertTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, count, sum, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserVerification(id: string, isVerified: boolean): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Admin methods
  getAdminStats(): Promise<{ totalUsers: number; activeListings: number; pendingReports: number; estimatedValue: number }>;

  // Product methods
  getProduct(id: string): Promise<Product | undefined>;
  getProducts(filters?: { category?: string; status?: string }): Promise<Product[]>;
  getProductsByUser(userId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Conversation methods
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByUser(userId: string): Promise<Conversation[]>;
  findOrCreateConversation(data: InsertConversation): Promise<Conversation>;

  // Message methods
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;

  // Report methods
  getReports(status?: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReportStatus(id: string, status: string): Promise<void>;

  // Payment methods
  getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]>;
  getPaymentMethodByIdAndUser(id: string, userId: string): Promise<PaymentMethod | undefined>;
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  deletePaymentMethod(id: string): Promise<void>;

  // Transaction methods
  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  purchaseProduct(buyerId: string, productId: string, paymentMethodId: string): Promise<Transaction>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserVerification(id: string, isVerified: boolean): Promise<void> {
    await db.update(users).set({ isVerified }).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Admin stats
  async getAdminStats(): Promise<{ totalUsers: number; activeListings: number; pendingReports: number; estimatedValue: number }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [listingCount] = await db.select({ count: count() }).from(products)
      .where(or(eq(products.status, "active"), eq(products.status, "available")));
    const [reportCount] = await db.select({ count: count() }).from(reports)
      .where(eq(reports.status, "pending"));
    const [priceSum] = await db.select({ total: sql<number>`COALESCE(SUM(${products.price}), 0)` })
      .from(products)
      .where(or(eq(products.status, "active"), eq(products.status, "available")));

    return {
      totalUsers: userCount?.count || 0,
      activeListings: listingCount?.count || 0,
      pendingReports: reportCount?.count || 0,
      estimatedValue: Number(priceSum?.total) || 0,
    };
  }

  // Product methods
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProducts(filters?: { category?: string; status?: string }): Promise<Product[]> {
    let query = db.select().from(products);
    
    const conditions = [];
    if (filters?.category) {
      conditions.push(eq(products.category, filters.category));
    }
    if (filters?.status) {
      conditions.push(eq(products.status, filters.status));
    } else {
      conditions.push(or(eq(products.status, "active"), eq(products.status, "available")));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.orderBy(desc(products.createdAt));
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.userId, userId)).orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db.update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.update(products)
      .set({ status: "removed" })
      .where(eq(products.id, id));
  }

  // Conversation methods
  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    return db.select()
      .from(conversations)
      .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async findOrCreateConversation(data: InsertConversation): Promise<Conversation> {
    const [existing] = await db.select()
      .from(conversations)
      .where(
        and(
          eq(conversations.productId, data.productId),
          eq(conversations.buyerId, data.buyerId),
          eq(conversations.sellerId, data.sellerId)
        )
      );

    if (existing) return existing;

    const [newConversation] = await db.insert(conversations).values(data).returning();
    return newConversation;
  }

  // Message methods
  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Update conversation's lastMessageAt
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderId, userId)
        )
      );
  }

  // Report methods
  async getReports(status?: string): Promise<Report[]> {
    let query = db.select().from(reports);
    
    if (status) {
      query = query.where(eq(reports.status, status)) as any;
    }

    return query.orderBy(desc(reports.createdAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async updateReportStatus(id: string, status: string): Promise<void> {
    await db.update(reports).set({ status }).where(eq(reports.id, id));
  }

  // Payment methods
  async getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]> {
    return db.select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(desc(paymentMethods.createdAt));
  }

  async createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const [newPaymentMethod] = await db.insert(paymentMethods).values(paymentMethod).returning();
    return newPaymentMethod;
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  }

  // Transaction methods
  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return db.select()
      .from(transactions)
      .where(or(eq(transactions.buyerId, userId), eq(transactions.sellerId, userId)))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getPaymentMethodByIdAndUser(id: string, userId: string): Promise<PaymentMethod | undefined> {
    const [paymentMethod] = await db.select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, userId)));
    return paymentMethod || undefined;
  }

  async purchaseProduct(buyerId: string, productId: string, paymentMethodId: string): Promise<Transaction> {
    // Use a database transaction for atomicity
    return await db.transaction(async (tx) => {
      // Get the product first to validate
      const [product] = await tx.select().from(products).where(eq(products.id, productId));
      if (!product) {
        throw new Error("Product not found");
      }
      if (product.status !== "available") {
        throw new Error("This product is no longer available");
      }
      if (product.userId === buyerId) {
        throw new Error("You cannot purchase your own product");
      }

      // Validate payment method belongs to buyer
      const [paymentMethod] = await tx.select()
        .from(paymentMethods)
        .where(and(eq(paymentMethods.id, paymentMethodId), eq(paymentMethods.userId, buyerId)));
      if (!paymentMethod) {
        throw new Error("Invalid payment method");
      }

      // Create transaction record
      const [newTransaction] = await tx.insert(transactions).values({
        buyerId,
        sellerId: product.userId,
        productId: product.id,
        amount: product.price,
        status: "completed",
      }).returning();

      // Update product status to sold
      await tx.update(products)
        .set({ status: "sold", updatedAt: new Date() })
        .where(eq(products.id, productId));

      return newTransaction;
    });
  }
}

export const storage = new DatabaseStorage();
