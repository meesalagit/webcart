import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MapPin, 
  ShieldCheck, 
  MessageCircle, 
  ShoppingCart,
  Loader2,
  CreditCard,
  Check,
  AlertCircle
} from "lucide-react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function ProductPage() {
  const [match, params] = useRoute("/product/:id");
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");

  const productId = params?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api.getProduct(productId!),
    enabled: !!productId,
  });

  const { data: paymentData } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => api.getPaymentMethods(),
    enabled: isAuthenticated,
  });

  const sellerId = data?.product?.userId;
  const { data: sellerData } = useQuery({
    queryKey: ["seller", sellerId],
    queryFn: () => api.getUser(sellerId!),
    enabled: !!sellerId && sellerId.length > 0,
  });

  const purchaseMutation = useMutation({
    mutationFn: (data: { productId: string; paymentMethodId: string }) => 
      api.purchaseProduct(data.productId, data.paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowPurchaseModal(false);
      toast({
        title: "Purchase Successful!",
        description: "Your order has been placed. Check your transaction history for details.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startConversationMutation = useMutation({
    mutationFn: (data: { productId: string; sellerId: string }) => 
      api.createConversation(data.productId, data.sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({
        title: "Conversation Started",
        description: "You can now message the seller.",
      });
      setLocation("/messages");
    },
    onError: (error: any) => {
      toast({
        title: "Could not start conversation",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const product = data?.product;
  const seller = sellerData?.user;
  const paymentMethods = paymentData?.paymentMethods || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">This product may have been removed or doesn't exist.</p>
          <Link href="/">
            <Button>Back to Browse</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isOwnProduct = user?.id === product.userId;
  const isSold = product.status === "sold";
  const canBuy = isAuthenticated && !isOwnProduct && !isSold;

  const handleBuyClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in Required",
        description: "Please sign in to purchase this item.",
      });
      setLocation("/auth");
      return;
    }
    
    if (paymentMethods.length === 0) {
      toast({
        title: "No Payment Method",
        description: "Please add a payment method in your dashboard first.",
      });
      setLocation("/dashboard");
      return;
    }
    
    setSelectedPaymentMethod(paymentMethods[0]?.id || "");
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please select a payment method to continue.",
        variant: "destructive",
      });
      return;
    }
    
    purchaseMutation.mutate({
      productId: product.id,
      paymentMethodId: selectedPaymentMethod,
    });
  };

  const sellerInitials = seller 
    ? `${seller.firstName?.charAt(0) || ''}${seller.lastName?.charAt(0) || ''}`
    : 'S';
  const sellerName = seller 
    ? `${seller.firstName} ${seller.lastName}` 
    : 'Campus Seller';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary gap-2" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" /> Back to Browse
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-black/5 shadow-sm">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                  data-testid="img-product-main"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ShoppingCart className="h-20 w-20" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-display font-bold text-gray-900 mb-2" data-testid="text-product-title">{product.title}</h1>
                  <div className="flex items-center gap-2 text-2xl font-bold text-primary" data-testid="text-product-price">
                    ${product.price}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="rounded-full" data-testid="button-share">
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" data-testid="button-favorite">
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {isSold && (
                  <Badge variant="destructive" className="bg-red-100 text-red-700">
                    Sold
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-secondary/10 text-secondary-foreground hover:bg-secondary/20" data-testid="badge-condition">
                  {product.condition}
                </Badge>
                <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground" data-testid="badge-category">
                  {product.category}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <MapPin className="h-4 w-4 text-primary" />
                Located at <span className="font-medium text-foreground" data-testid="text-location">{product.location}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Description</h3>
              <p className="text-gray-600 leading-relaxed" data-testid="text-description">
                {product.description}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Seller</h3>
              <div className="flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {sellerInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-gray-900" data-testid="text-seller-name">{sellerName}</p>
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <ShieldCheck className="h-3 w-3" /> Verified Student
                    </div>
                  </div>
                </div>
                {seller?.university && (
                  <div className="text-right text-xs text-muted-foreground capitalize">
                    {seller.university}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {canBuy && (
                <Button 
                  size="lg" 
                  className="flex-1 rounded-full h-12 text-base shadow-lg shadow-primary/25 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleBuyClick}
                  data-testid="button-buy"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now - ${product.price}
                </Button>
              )}
              {!isSold && !isOwnProduct && (
                <Button 
                  size="lg" 
                  variant="outline"
                  className={`${canBuy ? '' : 'flex-1'} rounded-full h-12 text-base`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      setLocation("/auth");
                      return;
                    }
                    startConversationMutation.mutate({
                      productId: product.id,
                      sellerId: product.userId,
                    });
                  }}
                  disabled={startConversationMutation.isPending}
                  data-testid="button-message"
                >
                  {startConversationMutation.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-2 h-5 w-5" />
                  )}
                  Message
                </Button>
              )}
              {isOwnProduct && (
                <div className="flex-1 text-center py-3 text-muted-foreground">
                  This is your listing
                </div>
              )}
              {isSold && !isOwnProduct && (
                <div className="flex-1 text-center py-3 text-muted-foreground">
                  This item has been sold
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
            <DialogDescription>
              Confirm your purchase of {product.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.title}</p>
                    <p className="text-sm text-muted-foreground capitalize">{product.condition} - {product.category}</p>
                  </div>
                  <div className="text-lg font-bold text-primary">
                    ${product.price}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Payment Method</Label>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No payment methods available</p>
                  <Link href="/dashboard">
                    <Button variant="link" size="sm">Add a payment method</Button>
                  </Link>
                </div>
              ) : (
                <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  {paymentMethods.map((method) => (
                    <div 
                      key={method.id} 
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPaymentMethod === method.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label htmlFor={method.id} className="flex-1 cursor-pointer flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{method.brand} ****{method.last4}</p>
                          <p className="text-xs text-muted-foreground">Expires {method.expiryMonth}/{method.expiryYear}</p>
                        </div>
                      </Label>
                      {selectedPaymentMethod === method.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowPurchaseModal(false)}
                data-testid="button-cancel-purchase"
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleConfirmPurchase}
                disabled={purchaseMutation.isPending || !selectedPaymentMethod}
                data-testid="button-confirm-purchase"
              >
                {purchaseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Confirm Purchase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
