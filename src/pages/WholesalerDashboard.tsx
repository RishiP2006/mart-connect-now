import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, DollarSign, TrendingUp } from 'lucide-react';
import { WholesaleProductCard } from '@/components/WholesaleProductCard';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  wholesale_price?: number;
  image_url: string;
  stock_quantity: number;
}

interface Stats {
  availableProducts: number;
  totalSpent: number;
  avgSavings: number;
}

import { DashboardHeader } from '@/components/DashboardHeader';

export default function WholesalerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({ availableProducts: 0, totalSpent: 0, avgSavings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch products with wholesale prices
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .not('wholesale_price', 'is', null)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false });

      if (productsData) {
        setProducts(productsData as Product[]);
        
        // Calculate average savings
        const totalSavings = productsData.reduce((sum, p) => {
          if (p.wholesale_price && p.price) {
            return sum + (p.price - p.wholesale_price);
          }
          return sum;
        }, 0);
        const avgSavings = productsData.length > 0 ? totalSavings / productsData.length : 0;

        setStats(prev => ({ 
          ...prev, 
          availableProducts: productsData.length,
          avgSavings 
        }));
      }

      // Fetch wholesaler's order history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('total_price')
          .eq('customer_id', user.id);

        if (ordersData) {
          const totalSpent = ordersData.reduce((sum, order) => sum + Number(order.total_price), 0);
          setStats(prev => ({ ...prev, totalSpent }));
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <>
      <DashboardHeader title="Wholesaler Dashboard" role="wholesaler" />
      <main className="container mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold mb-2">Wholesaler Dashboard</h1>
        <p className="text-muted-foreground">Access wholesale prices and bulk ordering</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">with wholesale pricing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">per product</p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-4">Wholesale Products</h2>
        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No wholesale products available at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <WholesaleProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
    </>
  );
}
