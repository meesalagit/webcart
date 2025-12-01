import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  DollarSign,
  ArrowUpRight,
  MoreHorizontal,
  CheckCircle2,
  ArrowRight,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => api.getAdminStats(),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => api.getAllUsers(),
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ["adminReports"],
    queryFn: () => api.getReports(),
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      api.updateReportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast({ title: "Report updated" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) => 
      api.updateUserStatus(id, isVerified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: "User updated" });
    },
  });

  const stats = statsData ? [
    {
      title: "Total Users",
      value: statsData.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active Listings",
      value: statsData.activeListings.toLocaleString(),
      icon: ShoppingBag,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      title: "Pending Reports",
      value: statsData.pendingReports.toLocaleString(),
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "Est. Value",
      value: `$${(statsData.estimatedValue / 1000).toFixed(1)}k`,
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ] : [];

  const reports = reportsData?.reports || [];
  const users = usersData?.users?.filter(u => u.role !== 'admin').slice(0, 5) || [];

  const isLoading = statsLoading || usersLoading || reportsLoading;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900" data-testid="text-admin-title">Dashboard</h1>
          <p className="text-muted-foreground">Overview of campus marketplace activity.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.title} className="border-none shadow-sm ring-1 ring-gray-200" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s/g, '-')}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div className="flex items-center text-xs font-medium text-green-600">
                        <ArrowUpRight className="h-3 w-3 ml-0.5" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>Flagged items requiring attention.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">View All</Button>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No reports yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-gray-50/50 border-b">
                          <tr>
                            <th className="px-4 py-3 font-medium">Item</th>
                            <th className="px-4 py-3 font-medium">Reason</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {reports.slice(0, 5).map((report: any) => (
                            <tr key={report.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`row-report-${report.id}`}>
                              <td className="px-4 py-3 font-medium text-gray-900">{report.productId}</td>
                              <td className="px-4 py-3 text-muted-foreground">{report.reason}</td>
                              <td className="px-4 py-3">
                                <Badge variant="secondary" className={`
                                  ${report.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}
                                `}>
                                  {report.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => updateReportMutation.mutate({ id: report.id, status: 'reviewed' })}>
                                      Mark Reviewed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateReportMutation.mutate({ id: report.id, status: 'resolved' })}>
                                      Resolve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">Remove Item</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm ring-1 ring-gray-200">
                <CardHeader>
                  <CardTitle>New Students</CardTitle>
                  <CardDescription>Latest registrations.</CardDescription>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No students yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {users.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between" data-testid={`row-user-${user.id}`}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          {user.isVerified ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs text-amber-600 hover:text-amber-700"
                              onClick={() => updateUserMutation.mutate({ id: user.id, isVerified: true })}
                            >
                              Verify
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" className="w-full mt-6 text-muted-foreground hover:text-primary">
                    View All Users <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
