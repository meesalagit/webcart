import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Filter, ArrowRight, Loader2 } from "lucide-react";
import { CATEGORIES } from "@/lib/mockData";
import heroImg from "@assets/generated_images/college_students_hanging_out_on_campus_lawn_with_laptops.png";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", selectedCategory],
    queryFn: () => api.getProducts(
      selectedCategory === "all" ? {} : { category: selectedCategory, status: "available" }
    ),
  });

  const products = data?.products || [];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-primary/5 border-b">
        <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <Badge variant="secondary" className="px-3 py-1 text-sm font-medium bg-white text-primary border-primary/20 shadow-sm">
              Trusted by 500+ Students
            </Badge>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-gray-900 leading-[1.1]">
              Buy & Sell on <br/>
              <span className="text-primary">Your Campus</span>
            </h1>
            <p className="text-lg text-muted-foreground md:max-w-lg mx-auto md:mx-0">
              The exclusive marketplace for students. Find cheap textbooks, 
              dorm furniture, and gear from people you trust.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
              <Button size="lg" className="rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-primary/20">
                Browse Items
              </Button>
              <Link href="/create-listing">
                <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base font-semibold bg-white hover:bg-gray-50">
                  Sell Something
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 relative w-full max-w-lg">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[2rem] blur-3xl -z-10" />
            <img 
              src={heroImg} 
              alt="Students on campus" 
              className="w-full h-auto rounded-[2rem] shadow-2xl ring-1 ring-black/5 object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* Categories Scroll */}
      <section className="border-b bg-white sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 min-w-max">
            <Button variant="outline" size="sm" className="rounded-full gap-2 border-dashed">
              <Filter className="h-4 w-4" /> Filters
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "bg-secondary/10 text-secondary-foreground hover:bg-secondary/20"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold text-gray-900">
            {selectedCategory === "all" ? "Fresh Finds" : CATEGORIES.find(c => c.id === selectedCategory)?.name}
          </h2>
          <Button variant="link" className="text-primary gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Failed to load products. Please try again later.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <Card className="group cursor-pointer border-0 shadow-none hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white ring-1 ring-black/5" data-testid={`card-product-${product.id}`}>
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm font-bold shadow-sm">
                      ${product.price}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {product.location}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground border-t border-gray-50 mt-auto">
                    <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                    <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}