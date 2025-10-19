import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RoleCard } from "@/components/RoleCard";
import { ShoppingCart, Store, Package } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const roles = [
    {
      title: "Customer",
      description: "Shop from local retailers and wholesalers",
      icon: ShoppingCart,
      features: [
        "Browse diverse product categories",
        "Compare prices from multiple sellers",
        "Track orders in real-time",
        "Rate and review products",
      ],
      onSelect: () => navigate("/auth?role=customer"),
    },
    {
      title: "Retailer",
      description: "Sell products to customers and manage inventory",
      icon: Store,
      features: [
        "List and manage your products",
        "Access wholesale pricing",
        "Process customer orders",
        "Track sales and inventory",
      ],
      onSelect: () => navigate("/auth?role=retailer"),
    },
    {
      title: "Wholesaler",
      description: "Supply bulk products to retailers",
      icon: Package,
      features: [
        "Manage bulk inventory",
        "Set wholesale pricing",
        "Connect with retailers",
        "Track bulk orders",
      ],
      onSelect: () => navigate("/auth?role=wholesaler"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              🎯 Your Local E-Commerce Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-secondary">
              Welcome to Live MART
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Connect customers, retailers, and wholesalers in one powerful marketplace
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-muted-foreground">Local Products</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-muted-foreground">Real-time Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-muted-foreground">Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Role</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select how you want to use Live MART and start your journey
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {roles.map((role) => (
            <RoleCard key={role.title} {...role} />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-8 md:p-12">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose Live MART?</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <div className="text-4xl">🎯</div>
                <h3 className="font-semibold text-lg">Personalized Experience</h3>
                <p className="text-sm text-muted-foreground">
                  Smart recommendations based on your preferences
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl">📍</div>
                <h3 className="font-semibold text-lg">Local Focus</h3>
                <p className="text-sm text-muted-foreground">
                  Discover products from nearby retailers
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl">⚡</div>
                <h3 className="font-semibold text-lg">Real-time Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Track orders and inventory instantly
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Live MART. Connecting local commerce.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
