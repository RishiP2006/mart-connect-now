import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package, DollarSign, ShoppingCart } from 'lucide-react';
import { ProductManagementDialog } from '@/components/ProductManagementDialog';
import { RetailerProductCard } from '@/components/RetailerProductCard';

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
  totalProducts: number;
  totalRevenue: number;
  pendingOrders: number;
}

import { DashboardHeader } from '@/components/DashboardHeader';

export default function RetailerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalRevenue: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch retailer's products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (productsData) {
      setProducts(productsData);
      setStats(prev => ({ ...prev, totalProducts: productsData.length }));
    }

    // Fetch order stats
    const { data: ordersData } = await supabase
      .from('orders')
      .select('total_price, status, products!inner(seller_id)')
      .eq('products.seller_id', user.id);

    if (ordersData) {
      const totalRevenue = ordersData.reduce((sum, order) => sum + Number(order.total_price), 0);
      const pendingOrders = ordersData.filter(order => order.status === 'pending').length;
      setStats(prev => ({ ...prev, totalRevenue, pendingOrders }));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <>
      <DashboardHeader title="Retailer Dashboard" role="retailer" />
      <main className="container mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Retailer Dashboard</h1>
          <p className="text-muted-foreground">Manage your products and orders</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-4">My Products</h2>
        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">You haven't added any products yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <RetailerProductCard 
                key={product.id} 
                product={product}
                onUpdate={fetchData}
              />
            ))}
          </div>
        )}
      </section>

      <ProductManagementDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
      />
    </main>
    </>
  );
}
