import { Link, useLocation } from "wouter";
import { Search, ShoppingBag, MessageCircle, User, PlusCircle, Menu, LogOut, Phone, Mail, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const userInitials = user 
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
    : 'U';

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-primary">CampusCart</span>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search for textbooks, furniture..." 
              className="pl-10 bg-muted/50 border-transparent focus:bg-white focus:border-primary/20 transition-all rounded-full"
            />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/create-listing">
                  <Button size="sm" className="gap-2 rounded-full font-medium shadow-sm hover:shadow-md transition-all" data-testid="button-sell-item">
                    <PlusCircle className="h-4 w-4" />
                    Sell Item
                  </Button>
                </Link>
                
                <Link href="/messages">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full relative text-muted-foreground hover:text-primary hover:bg-primary/5"
                    data-testid="button-messages"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 gap-2 pl-1 pr-3">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary text-white text-xs">{userInitials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-700">{user?.firstName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                    <Link href="/dashboard">
                      <DropdownMenuItem className="rounded-lg cursor-pointer font-medium" data-testid="link-dashboard">
                        My Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="rounded-lg cursor-pointer">Settings</DropdownMenuItem>
                    <div className="h-px bg-border my-1" />
                    <DropdownMenuItem 
                      className="rounded-lg cursor-pointer text-red-500 focus:text-red-600"
                      onClick={handleLogout}
                      data-testid="button-logout-menu"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" size="sm" className="rounded-full font-medium" data-testid="button-login">
                    Log In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="sm" className="rounded-full font-medium shadow-sm" data-testid="button-signup">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 mt-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search..." 
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-lg font-medium">Browse</Button>
                  </Link>
                  {isAuthenticated ? (
                    <>
                      <Link href="/create-listing" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-lg font-medium">Sell Item</Button>
                      </Link>
                      <Link href="/messages" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-lg font-medium">Messages</Button>
                      </Link>
                      <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-lg font-medium">My Dashboard</Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-lg font-medium text-red-500"
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      >
                        Log Out
                      </Button>
                    </>
                  ) : (
                    <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-lg font-medium">Login / Sign Up</Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-12 mt-20">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-white">
                <ShoppingBag className="h-3 w-3" />
              </div>
              <span className="font-display font-bold text-lg text-primary">CampusCart</span>
            </div>
            <p className="text-muted-foreground">
              The safe, student-only marketplace for your campus community.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground">Shop</h4>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">All Categories</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Textbooks</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Furniture</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Electronics</a>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground">Support</h4>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Safety Tips</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Community Guidelines</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</a>
            <button 
              onClick={() => setIsContactOpen(true)}
              className="text-muted-foreground hover:text-primary transition-colors text-left"
              data-testid="button-contact-us"
            >
              Contact Us
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground">Legal</h4>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
          © 2025 CampusCart Inc. All rights reserved.
        </div>
      </footer>

      {/* Contact Us Dialog */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <ShoppingBag className="h-4 w-4" />
              </div>
              Contact CampusCart
            </DialogTitle>
            <DialogDescription>
              We're here to help! Reach out to us through any of the following channels.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-lg font-semibold">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg font-semibold">support@campuscart.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-lg font-semibold">123 University Ave, Campus City, CA 94000</p>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Available Monday - Friday, 9AM - 6PM PST
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}