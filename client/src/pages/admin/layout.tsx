import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  Settings, 
  LogOut,
  Search,
  Bell,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/admin/login");
  };

  const adminInitials = user 
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
    : 'AD';

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Listings", href: "/admin/listings", icon: ShoppingBag },
    { name: "Reports", href: "/admin/reports", icon: AlertTriangle },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 flex font-sans text-foreground">
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0
        `}
      >
        <div className="h-16 flex items-center px-6 border-b">
          <div className="flex items-center gap-2 font-display font-bold text-xl text-gray-900">
            <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center text-white">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            CampusCart <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-normal ml-1">Admin</span>
          </div>
        </div>

        <div className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
                    ${isActive 
                      ? "bg-gray-900 text-white shadow-md shadow-gray-900/20" 
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-3"
            onClick={handleLogout}
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-10 bg-gray-50 border-transparent focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-gray-900">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </Button>
            
            <div className="h-8 w-px bg-border mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-3 pl-2 pr-4 hover:bg-gray-50 rounded-full">
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <AvatarFallback className="bg-gray-900 text-white">{adminInitials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 leading-none" data-testid="text-admin-name">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Administrator</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={handleLogout}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}