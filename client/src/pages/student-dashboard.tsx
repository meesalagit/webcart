import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  Package, 
  ShoppingBag, 
  Settings, 
  Plus, 
  Clock,
  MapPin,
  Edit2,
  Trash2,
  LogOut,
  Loader2,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    brand: "Visa",
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["myProducts", user?.id],
    queryFn: () => api.getUserProducts(user!.id),
    enabled: !!user?.id,
  });

  const { data: paymentData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => api.getPaymentMethods(),
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.getTransactions(),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => api.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProducts"] });
      toast({ title: "Listing deleted" });
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: (data: any) => api.addPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      toast({ title: "Payment method added" });
      setIsAddingCard(false);
      setCardForm({ cardNumber: "", expiryMonth: "", expiryYear: "", brand: "Visa" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to add payment method", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id: string) => api.deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      toast({ title: "Payment method removed" });
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const last4 = cardForm.cardNumber.slice(-4);
    addPaymentMutation.mutate({
      brand: cardForm.brand,
      last4,
      expiryMonth: cardForm.expiryMonth,
      expiryYear: cardForm.expiryYear,
    });
  };

  const myListings = productsData?.products || [];
  const paymentMethods = paymentData?.paymentMethods || [];

  const userInitials = user 
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
    : 'U';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          <aside className="w-full md:w-64 shrink-0 space-y-6">
            <Card className="text-center overflow-hidden border-none shadow-lg ring-1 ring-gray-100">
              <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
              <div className="relative px-6 pb-6">
                <Avatar className="h-20 w-20 border-4 border-white -mt-10 mx-auto shadow-sm">
                  <AvatarFallback className="bg-primary text-white text-xl font-bold">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="mt-3 space-y-1">
                  <h2 className="font-display font-bold text-lg" data-testid="text-user-name">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700 hover:bg-green-200">
                    {user?.isVerified ? "Verified Student" : "Pending Verification"}
                  </Badge>
                </div>
                <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900" data-testid="text-listings-count">{myListings.length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Listings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{user?.university || '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">University</div>
                  </div>
                </div>
              </div>
            </Card>

            <nav className="space-y-1">
              <Link href="/messages">
                <Button variant="ghost" className="w-full justify-start gap-3 text-gray-600">
                  <ShoppingBag className="h-4 w-4" /> Messages
                </Button>
              </Link>
              <Button variant="ghost" className="w-full justify-start gap-3 text-gray-600">
                <Settings className="h-4 w-4" /> Settings
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" /> Log Out
              </Button>
            </nav>
          </aside>

          <div className="flex-1">
            <Tabs defaultValue="listings" className="space-y-6">
              <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none p-0 space-x-6">
                <TabsTrigger 
                  value="listings" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-medium"
                  data-testid="tab-listings"
                >
                  My Listings
                </TabsTrigger>
                <TabsTrigger 
                  value="payment" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-medium"
                  data-testid="tab-payment"
                >
                  Payment Methods
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-medium"
                  data-testid="tab-history"
                >
                  Transaction History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="listings" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Active Listings</h3>
                  <Link href="/create-listing">
                    <Button size="sm" className="gap-2 rounded-full" data-testid="button-new-listing">
                      <Plus className="h-4 w-4" /> New Listing
                    </Button>
                  </Link>
                </div>
                
                {productsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : myListings.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">No listings yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Start selling by creating your first listing.</p>
                    <Link href="/create-listing">
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Create Listing
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {myListings.map((item) => (
                      <Card key={item.id} className="flex flex-col sm:flex-row overflow-hidden group" data-testid={`card-listing-${item.id}`}>
                        <div className="w-full sm:w-32 aspect-video sm:aspect-square bg-gray-100">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                          )}
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-gray-900 line-clamp-1">{item.title}</h4>
                              <Badge variant="outline">${item.price}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="outline" size="icon" className="h-8 w-8"><Edit2 className="h-4 w-4" /></Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={() => deleteProductMutation.mutate(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payment" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Payment Methods</h3>
                  <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2 rounded-full" data-testid="button-add-payment">
                        <Plus className="h-4 w-4" /> Add Card
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Payment Method</DialogTitle>
                        <DialogDescription>
                          Add a credit or debit card for transactions.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddCard} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input 
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={cardForm.cardNumber}
                            onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                            data-testid="input-card-number"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiryMonth">Month</Label>
                            <Input 
                              id="expiryMonth"
                              placeholder="MM"
                              maxLength={2}
                              value={cardForm.expiryMonth}
                              onChange={(e) => setCardForm({ ...cardForm, expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                              data-testid="input-expiry-month"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expiryYear">Year</Label>
                            <Input 
                              id="expiryYear"
                              placeholder="YY"
                              maxLength={2}
                              value={cardForm.expiryYear}
                              onChange={(e) => setCardForm({ ...cardForm, expiryYear: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                              data-testid="input-expiry-year"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cvv">CVV</Label>
                            <Input 
                              id="cvv"
                              placeholder="123"
                              maxLength={3}
                              type="password"
                              data-testid="input-cvv"
                              required
                            />
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={addPaymentMutation.isPending}
                          data-testid="button-save-card"
                        >
                          {addPaymentMutation.isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                          ) : (
                            "Save Card"
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {paymentsLoading ? (
                    <div className="flex justify-center py-12 col-span-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <Card className="border-dashed flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-gray-50 transition-colors col-span-2" onClick={() => setIsAddingCard(true)}>
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Plus className="h-6 w-6 text-gray-600" />
                      </div>
                      <p className="font-medium text-gray-900">Add Payment Method</p>
                      <p className="text-sm text-muted-foreground">Click to add your first card</p>
                    </Card>
                  ) : (
                    <>
                      {paymentMethods.map((pm) => (
                        <Card key={pm.id} className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl relative group" data-testid={`card-payment-${pm.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deletePaymentMutation.mutate(pm.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <CardContent className="p-6 flex flex-col justify-between h-48">
                            <div className="flex justify-between items-start">
                              <CreditCard className="h-8 w-8 opacity-80" />
                              <span className="text-sm font-medium">{pm.brand}</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-400 uppercase tracking-wider">Card Number</p>
                              <p className="text-xl font-mono tracking-widest">•••• •••• •••• {pm.last4}</p>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-xs text-gray-400 uppercase">Card Holder</p>
                                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 uppercase">Expires</p>
                                <p className="font-medium">{pm.expiryMonth}/{pm.expiryYear}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Card 
                        className="border-dashed flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setIsAddingCard(true)}
                      >
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          <Plus className="h-6 w-6 text-gray-600" />
                        </div>
                        <p className="font-medium text-gray-900">Add New Card</p>
                        <p className="text-sm text-muted-foreground">Secure payment processing</p>
                      </Card>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <h3 className="text-lg font-semibold">Transaction History</h3>
                
                {transactionsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !transactionsData?.transactions?.length ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="font-medium text-gray-900 mb-2">No transactions yet</h3>
                      <p className="text-sm">Your transaction history will appear here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {transactionsData.transactions.map((tx) => {
                      const isBuyer = tx.buyerId === user?.id;
                      const statusIcon = tx.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : tx.status === 'cancelled' || tx.status === 'refunded' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      );
                      
                      return (
                        <Card key={tx.id} className="overflow-hidden" data-testid={`transaction-${tx.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${isBuyer ? 'bg-red-100' : 'bg-green-100'}`}>
                                  {isBuyer ? (
                                    <ArrowUpRight className={`h-5 w-5 ${isBuyer ? 'text-red-600' : 'text-green-600'}`} />
                                  ) : (
                                    <ArrowDownLeft className="h-5 w-5 text-green-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {isBuyer ? 'Purchase' : 'Sale'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Product #{tx.productId.slice(0, 8)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-semibold ${isBuyer ? 'text-red-600' : 'text-green-600'}`}>
                                  {isBuyer ? '-' : '+'}${tx.amount}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  {statusIcon}
                                  <span className="capitalize">{tx.status}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(tx.createdAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                {tx.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
