import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Store, TrendingUp } from 'lucide-react';

export default function RoleSelection() {
  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      description: 'Browse and purchase products from local retailers and wholesalers',
      icon: ShoppingBag,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'retailer',
      title: 'Retailer',
      description: 'List your products and sell to customers and wholesalers',
      icon: Store,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      id: 'wholesaler',
      title: 'Wholesaler',
      description: 'Access wholesale prices and bulk ordering options',
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="w-full max-w-5xl space-y-8">
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Welcome to RURA-Mart</h1>
          <p className="text-xl text-muted-foreground">Choose how you'd like to get started</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card key={role.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-4">
                  <div className={`w-16 h-16 rounded-full ${role.bgColor} flex items-center justify-center mx-auto`}>
                    <Icon className={`h-8 w-8 ${role.color}`} />
                  </div>
                  <CardTitle className="text-center text-2xl">{role.title}</CardTitle>
                  <CardDescription className="text-center text-base">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="lg" asChild>
                    <Link to={`/auth?role=${role.id}`}>Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/auth" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
