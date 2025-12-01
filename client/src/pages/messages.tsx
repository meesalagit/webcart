import { Layout } from "@/components/layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageCircle, Package } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Conversation, Message, User, Product } from "@shared/schema";

interface ConversationWithDetails extends Conversation {
  otherUser?: User;
  product?: Product;
  messages?: Message[];
}

export default function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.getConversations(),
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", activeConversationId],
    queryFn: () => api.getMessages(activeConversationId!),
    enabled: !!activeConversationId,
    refetchInterval: 3000,
  });

  const { data: usersCache } = useQuery({
    queryKey: ["conversationUsers", conversationsData?.conversations],
    queryFn: async () => {
      if (!conversationsData?.conversations) return {};
      const userIds = new Set<string>();
      conversationsData.conversations.forEach(c => {
        userIds.add(c.buyerId);
        userIds.add(c.sellerId);
      });
      const users: Record<string, User> = {};
      for (const id of Array.from(userIds)) {
        try {
          const { user } = await api.getUser(id);
          users[id] = user;
        } catch (e) {
          console.log("Failed to fetch user", id);
        }
      }
      return users;
    },
    enabled: !!conversationsData?.conversations?.length,
  });

  const { data: productsCache } = useQuery({
    queryKey: ["conversationProducts", conversationsData?.conversations],
    queryFn: async () => {
      if (!conversationsData?.conversations) return {};
      const productIds = new Set<string>();
      conversationsData.conversations.forEach(c => productIds.add(c.productId));
      const products: Record<string, Product> = {};
      for (const id of Array.from(productIds)) {
        try {
          const { product } = await api.getProduct(id);
          products[id] = product;
        } catch (e) {
          console.log("Failed to fetch product", id);
        }
      }
      return products;
    },
    enabled: !!conversationsData?.conversations?.length,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      api.sendMessage(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeConversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setMessageInput("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  useEffect(() => {
    if (conversationsData?.conversations?.length && !activeConversationId) {
      setActiveConversationId(conversationsData.conversations[0].id);
    }
  }, [conversationsData, activeConversationId]);

  const conversations = conversationsData?.conversations || [];
  const messages = messagesData?.messages || [];

  const getOtherUser = (conversation: Conversation) => {
    if (!user || !usersCache) return null;
    const otherId = conversation.buyerId === user.id ? conversation.sellerId : conversation.buyerId;
    return usersCache[otherId];
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const activeOtherUser = activeConversation ? getOtherUser(activeConversation) : null;
  const activeProduct = activeConversation && productsCache ? productsCache[activeConversation.productId] : null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversationId) return;
    sendMessageMutation.mutate({
      conversationId: activeConversationId,
      content: messageInput.trim(),
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return formatTime(date);
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (conversationsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-8rem)]">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full gap-6 bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 overflow-hidden">
          
          <div className="border-r flex flex-col h-full">
            <div className="p-4 border-b bg-gray-50/50">
              <h2 className="font-display font-bold text-lg">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Message a seller to start a conversation</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherUser = getOtherUser(conv);
                  const product = productsCache?.[conv.productId];
                  const initials = otherUser 
                    ? `${otherUser.firstName?.charAt(0) || ''}${otherUser.lastName?.charAt(0) || ''}`
                    : '??';
                  const name = otherUser 
                    ? `${otherUser.firstName} ${otherUser.lastName}` 
                    : 'User';
                  const isBuyer = conv.buyerId === user?.id;
                  
                  return (
                    <div 
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        activeConversationId === conv.id 
                          ? "bg-primary/10 ring-1 ring-primary/20" 
                          : "hover:bg-gray-50"
                      }`}
                      data-testid={`conversation-${conv.id}`}
                    >
                      {product?.imageUrl ? (
                        <div className="h-12 w-12 rounded-lg overflow-hidden border shadow-sm shrink-0">
                          <img 
                            src={product.imageUrl} 
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <Avatar className="h-12 w-12 border border-white shadow-sm">
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`font-semibold text-sm truncate ${activeConversationId === conv.id ? "text-primary" : "text-gray-900"}`}>
                            {name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(conv.lastMessageAt)}</span>
                        </div>
                        <p className="text-xs truncate font-medium text-gray-700">
                          {product?.title || 'Product'}
                        </p>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {isBuyer ? '🛒 Buying' : '💰 Selling'}
                          </span>
                          {product && (
                            <span className="text-xs font-bold text-primary">${product.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="hidden md:flex col-span-2 flex-col h-full bg-white">
            {activeConversation ? (
              <>
                <div className="p-4 border-b flex items-center gap-3 shadow-sm z-10 bg-gradient-to-r from-white to-gray-50/50">
                  {activeProduct?.imageUrl && (
                    <div className="h-12 w-12 rounded-lg overflow-hidden border shadow-sm shrink-0">
                      <img 
                        src={activeProduct.imageUrl} 
                        alt={activeProduct.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <Avatar className="h-10 w-10 border-2 border-white shadow">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-bold">
                      {activeOtherUser 
                        ? `${activeOtherUser.firstName?.charAt(0) || ''}${activeOtherUser.lastName?.charAt(0) || ''}`
                        : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900">
                      {activeOtherUser ? `${activeOtherUser.firstName} ${activeOtherUser.lastName}` : 'User'}
                    </h3>
                    {activeProduct && (
                      <p className="text-xs text-muted-foreground truncate">
                        <span className="font-medium text-gray-700">{activeProduct.title}</span>
                        {' • '}{activeProduct.condition} • {activeProduct.location}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {activeConversation?.buyerId === user?.id ? 'You are the buyer' : 'You are the seller'}
                    </p>
                  </div>
                  {activeProduct && (
                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold text-primary">${activeProduct.price}</span>
                      <p className="text-[10px] text-muted-foreground">{activeProduct.category}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30 space-y-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`${
                            isOwn 
                              ? 'bg-primary text-white rounded-2xl rounded-tr-none shadow-md shadow-primary/20' 
                              : 'bg-white border rounded-2xl rounded-tl-none shadow-sm'
                          } py-3 px-4 max-w-[80%] text-sm`}>
                            <p>{msg.content}</p>
                            <span className={`text-[10px] mt-1 block ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t bg-white">
                  <form className="flex gap-2" onSubmit={handleSendMessage}>
                    <Input 
                      placeholder="Type a message..." 
                      className="rounded-full bg-gray-50 border-transparent focus:bg-white transition-all"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      disabled={sendMessageMutation.isPending}
                      data-testid="input-message"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="rounded-full shrink-0 shadow-md shadow-primary/20"
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      data-testid="button-send-message"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
