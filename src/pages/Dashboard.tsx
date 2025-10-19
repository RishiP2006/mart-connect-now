import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Package, ShoppingCart, Store, User } from "lucide-react";
import { Session } from "@supabase/supabase-js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      navigate("/auth");
      return;
    }

    const fetchUserData = async () => {
      try {
        // Fetch user role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (roleError) {
          console.error("Error fetching role:", roleError);
        } else {
          setUserRole(roleData?.role);
        }

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else {
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getRoleIcon = () => {
    switch (userRole) {
      case "customer":
        return ShoppingCart;
      case "retailer":
        return Store;
      case "wholesaler":
        return Package;
      default:
        return User;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <RoleIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Live MART</h1>
              <p className="text-xs text-muted-foreground capitalize">{userRole} Dashboard</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name}!</h2>
          <p className="text-muted-foreground">
            {userRole === "customer" && "Browse and shop from local retailers"}
            {userRole === "retailer" && "Manage your products and fulfill orders"}
            {userRole === "wholesaler" && "Supply retailers with bulk inventory"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userRole === "customer" && (
            <>
              <Card className="hover:shadow-[var(--shadow-hover)] transition-all">
                <CardHeader>
                  <CardTitle>Browse Products</CardTitle>
                  <CardDescription>Explore local products</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">View Catalog</Button>
                </CardContent>
              </Card>
              <Card className="hover:shadow-[var(--shadow-hover)] transition-all">
                <CardHeader>
                  <CardTitle>My Orders</CardTitle>
                  <CardDescription>Track your purchases</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">View Orders</Button>
                </CardContent>
              </Card>
            </>
          )}

          {(userRole === "retailer" || userRole === "wholesaler") && (
            <>
              <Card className="hover:shadow-[var(--shadow-hover)] transition-all">
                <CardHeader>
                  <CardTitle>My Products</CardTitle>
                  <CardDescription>Manage your inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Manage Products</Button>
                </CardContent>
              </Card>
              <Card className="hover:shadow-[var(--shadow-hover)] transition-all">
                <CardHeader>
                  <CardTitle>Orders</CardTitle>
                  <CardDescription>Process customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">View Orders</Button>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="hover:shadow-[var(--shadow-hover)] transition-all">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your information</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Edit Profile</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}