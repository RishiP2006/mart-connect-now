import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Package, DollarSign, ShoppingCart, Bell } from 'lucide-react';
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

interface RetailerOrder {
  id: string;
  quantity: number;
  total_price: number;
  payment_method: string;
  status: string;
  created_at: string;
  delivery_address: string;
  product?: {
    name: string;
  };
  customer?: {
    full_name: string;
  };
}

import { DashboardHeader } from '@/components/DashboardHeader';

export default function RetailerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalRevenue: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RetailerOrder[]>([]);

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
      .select(`
        id,
        quantity,
        total_price,
        payment_method,
        status,
        created_at,
        delivery_address,
        products!inner(seller_id, name),
        customer:profiles!orders_customer_id_fkey(full_name)
      `)
      .eq('products.seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (ordersData) {
      const totalRevenue = ordersData.reduce((sum, order) => sum + Number(order.total_price), 0);
      const pendingOrders = ordersData.filter(order => order.status === 'pending').length;
      setStats(prev => ({ ...prev, totalRevenue, pendingOrders }));
      setRecentOrders(ordersData as unknown as RetailerOrder[]);
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

      <section className="space-y-4">
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

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Latest Orders</h2>
          {stats.pendingOrders > 0 && (
            <Alert className="w-full md:w-auto">
              <Bell className="h-4 w-4" />
              <AlertTitle>Pending Orders</AlertTitle>
              <AlertDescription>
                You have {stats.pendingOrders} order{stats.pendingOrders === 1 ? '' : 's'} awaiting action.
              </AlertDescription>
            </Alert>
          )}
        </div>
        {recentOrders.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No orders yet. New orders will appear here as soon as customers buy your products.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {recentOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-semibold">{order.id}</p>
                    </div>
                    <span className="text-sm capitalize px-3 py-1 rounded-full bg-muted">
                      {order.status}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Customer</p>
                      <p className="font-medium">{order.customer?.full_name || 'Customer'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Product</p>
                      <p className="font-medium">{order.product?.name}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-semibold">{order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment</p>
                      <p className="font-semibold">
                        {order.payment_method === 'online' ? 'Online' : 'Cash on Delivery'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold">${Number(order.total_price).toFixed(2)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Delivery Address</p>
                    <p className="text-sm">{order.delivery_address}</p>
                  </div>
                </CardContent>
              </Card>
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
