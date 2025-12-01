import type { User, Product, InsertUser, InsertProduct, Message, Conversation, PaymentMethod, InsertPaymentMethod, Transaction } from "@shared/schema";

class ApiClient {
  private baseUrl = "/api";

  // Helper for API calls
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: InsertUser): Promise<{ user: User }> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string): Promise<{ user: User }> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request("/auth/logout", {
      method: "POST",
    });
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request("/auth/me");
  }

  // Product endpoints
  async getProducts(filters?: { category?: string; status?: string }): Promise<{ products: Product[] }> {
    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.status) params.set("status", filters.status);
    const query = params.toString();
    return this.request(`/products${query ? `?${query}` : ""}`);
  }

  async getProduct(id: string): Promise<{ product: Product }> {
    return this.request(`/products/${id}`);
  }

  async createProduct(data: InsertProduct): Promise<{ product: Product }> {
    return this.request("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async uploadImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<{ product: Product }> {
    return this.request(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    return this.request(`/products/${id}`, {
      method: "DELETE",
    });
  }

  async getUserProducts(userId: string): Promise<{ products: Product[] }> {
    return this.request(`/users/${userId}/products`);
  }

  // Conversation & Message endpoints
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    return this.request("/conversations");
  }

  async createConversation(productId: string, sellerId: string): Promise<{ conversation: Conversation }> {
    return this.request("/conversations", {
      method: "POST",
      body: JSON.stringify({ productId, sellerId }),
    });
  }

  async getMessages(conversationId: string): Promise<{ messages: Message[] }> {
    return this.request(`/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, content: string): Promise<{ message: Message }> {
    return this.request("/messages", {
      method: "POST",
      body: JSON.stringify({ conversationId, content }),
    });
  }

  // Payment methods
  async getPaymentMethods(): Promise<{ paymentMethods: PaymentMethod[] }> {
    return this.request("/payment-methods");
  }

  async addPaymentMethod(data: InsertPaymentMethod): Promise<{ paymentMethod: PaymentMethod }> {
    return this.request("/payment-methods", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deletePaymentMethod(id: string): Promise<{ message: string }> {
    return this.request(`/payment-methods/${id}`, {
      method: "DELETE",
    });
  }

  // Transaction endpoints
  async getTransactions(): Promise<{ transactions: Transaction[] }> {
    return this.request("/transactions");
  }

  async purchaseProduct(productId: string, paymentMethodId: string): Promise<{ transaction: Transaction }> {
    return this.request("/transactions", {
      method: "POST",
      body: JSON.stringify({ productId, paymentMethodId }),
    });
  }

  // User endpoints
  async getUser(id: string): Promise<{ user: User }> {
    return this.request(`/users/${id}`);
  }

  // Admin endpoints
  async getAdminStats(): Promise<{ 
    totalUsers: number; 
    activeListings: number; 
    pendingReports: number;
    estimatedValue: number;
  }> {
    return this.request("/admin/stats");
  }

  async getAllUsers(): Promise<{ users: User[] }> {
    return this.request("/admin/users");
  }

  async getAllProducts(): Promise<{ products: Product[] }> {
    return this.request("/admin/products");
  }

  async getReports(status?: string): Promise<{ reports: any[] }> {
    const params = status ? `?status=${status}` : "";
    return this.request(`/admin/reports${params}`);
  }

  async updateReportStatus(id: string, status: string): Promise<{ message: string }> {
    return this.request(`/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async updateUserStatus(id: string, isVerified: boolean): Promise<{ user: User }> {
    return this.request(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isVerified }),
    });
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    return this.request(`/admin/users/${id}`, {
      method: "DELETE",
    });
  }
}

export const api = new ApiClient();
