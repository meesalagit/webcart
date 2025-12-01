import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LayoutDashboard, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useLocation, Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";

export default function AdminLogin() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (isAuthenticated && isAdmin) {
    return <Redirect to="/admin" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await login(formData.email, formData.password);
      
      if (user.role !== "admin") {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Admin Access Granted",
        description: "Welcome back to the dashboard.",
      });
      setLocation("/admin");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-gray-800 bg-gray-900/50 backdrop-blur-xl text-white shadow-2xl shadow-black/50">
        <CardHeader className="space-y-4 pb-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/20">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display font-bold">Admin Portal</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Enter your credentials to access the management dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@university.edu" 
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/20 h-11" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                data-testid="input-admin-email"
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300">Forgot?</a>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type="password" 
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/20 pl-10 h-11" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  data-testid="input-admin-password"
                  required 
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-white text-gray-900 hover:bg-gray-200 font-semibold mt-4"
              disabled={isLoading}
              data-testid="button-admin-login"
            >
              {isLoading ? "Signing in..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}