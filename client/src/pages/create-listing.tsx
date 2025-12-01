import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImagePlus, Loader2, X } from "lucide-react";
import { CATEGORIES } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

export default function CreateListing() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    condition: "",
    description: "",
    location: "",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const createProductMutation = useMutation({
    mutationFn: (data: any) => api.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["myProducts"] });
      toast({
        title: "Listing Created!",
        description: "Your item has been posted to the marketplace.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create listing",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || formData.title.length < 3) {
      toast({
        title: "Title too short",
        description: "Title must be at least 3 characters.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Category required",
        description: "Please select a category.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.condition) {
      toast({
        title: "Condition required",
        description: "Please select a condition.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description || formData.description.length < 10) {
      toast({
        title: "Description too short",
        description: "Please add a description (at least 10 characters).",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl: string | null = null;
      
      // Upload image if selected
      if (selectedImage) {
        setIsUploading(true);
        const uploadResult = await api.uploadImage(selectedImage);
        imageUrl = uploadResult.imageUrl;
        setIsUploading(false);
      }

      createProductMutation.mutate({
        title: formData.title,
        price: formData.price,
        category: formData.category,
        condition: formData.condition,
        description: formData.description,
        location: formData.location || user?.university || "Campus",
        imageUrl,
      });
    } catch (error: any) {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Sell an Item</h1>
          <p className="text-muted-foreground">
            List your item for sale to thousands of students on campus.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-none shadow-xl shadow-black/5 ring-1 ring-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-6">
              <CardTitle>Item Details</CardTitle>
              <CardDescription>Provide as much detail as possible to sell faster.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              
              <div className="space-y-3">
                <Label>Photo (Optional)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                  data-testid="input-image"
                />
                <div className="grid grid-cols-3 gap-4">
                  {imagePreview ? (
                    <div className="aspect-square rounded-xl border-2 border-primary relative overflow-hidden group">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid="button-remove-image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      data-testid="button-add-photo"
                    >
                      <ImagePlus className="h-8 w-8 mb-2" />
                      <span className="text-xs font-medium">Add Photo</span>
                    </div>
                  )}
                  <div 
                    onClick={() => !imagePreview && fileInputRef.current?.click()}
                    className={`aspect-square rounded-xl border border-border bg-muted/20 flex items-center justify-center ${!imagePreview ? 'cursor-pointer hover:bg-muted/30' : ''}`}
                  >
                    <span className="text-xs text-muted-foreground">{imagePreview ? 'Cover' : 'Click to add'}</span>
                  </div>
                  <div className="aspect-square rounded-xl border border-border bg-muted/20 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Max 5MB</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Calculus Textbook 8th Ed" 
                    className="h-11" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    data-testid="input-title"
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      placeholder="0.00" 
                      className="h-11" 
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      data-testid="input-price"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="h-11" data-testid="select-category">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition *</Label>
                  <Select 
                    value={formData.condition} 
                    onValueChange={(value) => setFormData({ ...formData, condition: value })}
                  >
                    <SelectTrigger className="h-11" data-testid="select-condition">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like-new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe the item's condition, features, and why you're selling it (min 10 characters)..." 
                    className="min-h-[120px] resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    data-testid="input-description"
                    required
                  />
                  <p className="text-xs text-muted-foreground">{formData.description.length}/10 characters minimum</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Campus Location</Label>
                  <Input 
                    id="location" 
                    placeholder="e.g., Student Union, North Dorms" 
                    className="h-11"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    data-testid="input-location"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 rounded-full font-semibold shadow-lg shadow-primary/20"
                  disabled={createProductMutation.isPending || isUploading}
                  data-testid="button-post-listing"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading Image...
                    </>
                  ) : createProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Post Listing"
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  );
}
