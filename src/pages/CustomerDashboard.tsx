import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingProductCard } from '@/components/ShoppingProductCard';
import { Package, ShoppingBag, Clock, Receipt } from 'lucide-react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { OrderStatusTracker, OrderStatus } from '@/components/OrderStatusTracker';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  seller_id: string;
}

interface Order {
  id: string;
  status: OrderStatus;
  total_price: number;
  created_at: string;
  delivery_address?: string;
  quantity?: number;
  products: {
    name: string;
  };
}

export default function CustomerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .gt('stock_quantity', 0)
        .limit(8);

      if (productsData) setProducts(productsData as Product[]);

      // Fetch user's recent orders and recommendations
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch personalized recommendations
        await fetchRecommendations(user.id);
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            total_price,
            created_at,
            delivery_address,
            quantity,
            products (name)
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (ordersData) setRecentOrders(ordersData as Order[]);
      }

      setLoading(false);
    };

    fetchData();

    // Set up real-time subscription for order updates
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const channel = supabase
          .channel(`customer-orders-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `customer_id=eq.${user.id}`,
            },
            async (payload) => {
              if (payload.eventType === 'INSERT') {
                const { data: product } = await supabase
                  .from('products')
                  .select('name')
                  .eq('id', payload.new.product_id)
                  .single();

                setRecentOrders((prev) => {
                  const next = [
                    {
                      ...(payload.new as Order),
                      products: { name: product?.name || 'New order' },
                    },
                    ...prev,
                  ];
                  return next.slice(0, 5);
                });
              }

              if (payload.eventType === 'UPDATE') {
                setRecentOrders((prevOrders) =>
                  prevOrders.map((order) =>
                    order.id === payload.new.id
                      ? {
                          ...order,
                          status: payload.new.status as OrderStatus,
                        }
                      : order
                  )
                );
              }
            }
          )
          .subscribe();

        return channel;
      }
    };

    let channelRef: ReturnType<typeof supabase.channel> | undefined;
    setupRealtime().then((channel) => {
      channelRef = channel;
    });

    return () => {
      if (channelRef) {
        supabase.removeChannel(channelRef);
      }
    };
  }, []);

  const fetchRecommendations = async (userId: string) => {
    try {
      // Get user's browsing history
      const { data: browsingHistory } = await supabase
        .from('browsing_history')
        .select('product_id')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(10);

      // Get user's purchase history
      const { data: purchaseHistory } = await supabase
        .from('orders')
        .select('product_id')
        .eq('customer_id', userId)
        .limit(10);

      // Combine and get unique product IDs
      const viewedProductIds = browsingHistory?.map(h => h.product_id) || [];
      const purchasedProductIds = purchaseHistory?.map(o => o.product_id) || [];
      const allProductIds = [...new Set([...viewedProductIds, ...purchasedProductIds])];

      if (allProductIds.length === 0) {
        // No history, show featured products
        const { data: featuredData } = await supabase
          .from('products')
          .select('*')
          .gt('stock_quantity', 0)
          .limit(4);
        if (featuredData) setRecommendedProducts(featuredData as Product[]);
        return;
      }

      // Get categories of viewed/purchased products
      const { data: userProducts } = await supabase
        .from('products')
        .select('category_id')
        .in('id', allProductIds);

      const categoryIds = [...new Set(userProducts?.map(p => p.category_id).filter(Boolean) || [])];

      if (categoryIds.length === 0) {
        // No categories found, show featured products
        const { data: featuredData } = await supabase
          .from('products')
          .select('*')
          .gt('stock_quantity', 0)
          .limit(4);
        if (featuredData) setRecommendedProducts(featuredData as Product[]);
        return;
      }

      // Recommend products from same categories (excluding already viewed/purchased)
      const { data: allRecommended } = await supabase
        .from('products')
        .select('*')
        .in('category_id', categoryIds)
        .gt('stock_quantity', 0);

      // Filter out already viewed/purchased products
      const recommendedData = allRecommended?.filter(
        (p) => !allProductIds.includes(p.id)
      ).slice(0, 4);

      if (recommendedData && recommendedData.length > 0) {
        setRecommendedProducts(recommendedData as Product[]);
      } else {
        // Fallback to featured products
        const { data: featuredData } = await supabase
          .from('products')
          .select('*')
          .gt('stock_quantity', 0)
          .limit(4);
        if (featuredData) setRecommendedProducts(featuredData as Product[]);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Fallback to featured products
      const { data: featuredData } = await supabase
        .from('products')
        .select('*')
        .gt('stock_quantity', 0)
        .limit(4);
      if (featuredData) setRecommendedProducts(featuredData as Product[]);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <>
      <DashboardHeader title="Customer Dashboard" role="customer" />
      <main className="container mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold mb-2">Welcome to Live MART</h1>
        <p className="text-muted-foreground">Discover products from local retailers and wholesalers</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentOrders.filter(o => o.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {recommendedProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recommended for You</h2>
            <Link to="/products" className="text-primary hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((product) => (
              <ShoppingProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Link to="/products" className="text-primary hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ShoppingProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {recentOrders.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <h2 className="text-2xl font-bold text-foreground">Recent Orders</h2>
              <div className="inline-flex items-center gap-2 text-sm">
                <Receipt className="h-4 w-4" />
                Updated in real time
              </div>
            </div>
            <Button variant="outline" asChild size="sm">
              <Link to="/customer/orders">View all orders</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Order</p>
                      <p className="font-semibold">{order.products?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Placed {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm sm:text-right">
                      <p className="text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">${Number(order.total_price).toFixed(2)}</p>
                    </div>
                  </div>
                  <OrderStatusTracker status={order.status} />
                  {order.delivery_address && (
                    <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                      <p className="text-xs uppercase text-muted-foreground">Deliver to</p>
                      <p className="font-medium">{order.delivery_address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
    </>
  );
}
