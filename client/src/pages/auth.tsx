import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { GraduationCap, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Redirect } from "wouter";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";

export default function AuthPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    university: "",
  });

  if (isAuthenticated && !authLoading) {
    return <Redirect to="/dashboard" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast({
        title: "Welcome back to CampusCart!",
        description: "You have successfully logged in.",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailDomain = registerData.email.split('@')[1];
    const university = emailDomain?.replace('.edu', '') || '';

    setIsLoading(true);
    try {
      await register({
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        password: registerData.password,
        university,
        role: "student",
      });
      toast({
        title: "Welcome to CampusCart!",
        description: "Your account has been created successfully.",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-white mb-4 shadow-xl shadow-primary/30">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-gray-900">
            CampusCart
          </h1>
          <p className="text-muted-foreground">
            The exclusive marketplace for your campus.
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-black/10 ring-1 ring-black/5 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardContent className="p-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">School Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="student@university.edu" 
                      className="h-11 bg-white/50" 
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      data-testid="input-login-email"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      className="h-11 bg-white/50"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      data-testid="input-login-password"
                      required 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 rounded-full font-semibold text-base shadow-lg shadow-primary/20 mt-2"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? "Signing in..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input 
                        id="first-name" 
                        placeholder="Jane" 
                        className="h-11 bg-white/50"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                        data-testid="input-first-name"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input 
                        id="last-name" 
                        placeholder="Doe" 
                        className="h-11 bg-white/50"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                        data-testid="input-last-name"
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edu-email">School Email (.edu required)</Label>
                    <Input 
                      id="edu-email" 
                      type="email" 
                      placeholder="student@university.edu" 
                      className="h-11 bg-white/50"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      data-testid="input-register-email"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Create Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      className="h-11 bg-white/50"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      data-testid="input-register-password"
                      required 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 rounded-full font-semibold text-base shadow-lg shadow-primary/20 mt-2"
                    disabled={isLoading}
                    data-testid="button-register"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground px-4">
                    By signing up, you agree to verify your student status via email.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}