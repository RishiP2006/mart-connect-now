import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingProductCard } from '@/components/ShoppingProductCard';
import { Package, ShoppingBag, Clock } from 'lucide-react';

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
  status: string;
  total_price: number;
  created_at: string;
  products: {
    name: string;
  };
}

import { DashboardHeader } from '@/components/DashboardHeader';

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
          .channel('order-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `customer_id=eq.${user.id}`,
            },
            (payload) => {
              // Update the order in the list
              setRecentOrders((prevOrders) =>
                prevOrders.map((order) =>
                  order.id === payload.new.id
                    ? { ...order, status: payload.new.status as string }
                    : order
                )
              );
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };

    // Execute async setup and handle cleanup properly
    setupRealtime().then(cleanup => {
      if (cleanup) {
        // Store cleanup for useEffect return
        return cleanup;
      }
    });

    // Return cleanup function that will be called on unmount
    return () => {
      setupRealtime().then(cleanup => {
        if (cleanup) cleanup();
      });
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
        <section>
          <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{order.products?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${order.total_price}</p>
                      <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </main>
    </>
  );
}
