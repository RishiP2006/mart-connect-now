import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Package, DollarSign, ShoppingCart, Bell } from 'lucide-react';
import { ProductManagementDialog } from '@/components/ProductManagementDialog';
import { RetailerProductCard } from '@/components/RetailerProductCard';
import { OrderStatus, OrderStatusTracker } from '@/components/OrderStatusTracker';
import { toast } from 'sonner';

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
  status: OrderStatus;
  created_at: string;
  delivery_address: string;
  customer_id: string;
  product?: {
    name: string;
  };
  customer?: {
    full_name: string;
  };
  customer_role?: 'customer' | 'retailer' | 'wholesaler';
}

import { DashboardHeader } from '@/components/DashboardHeader';

export default function RetailerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalRevenue: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RetailerOrder[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const orderIdsRef = useRef<Set<string>>(new Set());
  const hasMountedRef = useRef(false);

  const fetchData = useCallback(async () => {
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

    // Fetch all orders for this retailer (from both customers and wholesalers)
    let ordersData;
    let orderError;

    // Query orders by seller_id - this will get orders from both customers and wholesalers
    // First try direct query with seller_id
    let { data: data1, error: error1 } = await supabase
      .from('orders')
      .select(`
        id,
        quantity,
        total_price,
        payment_method,
        status,
        created_at,
        delivery_address,
        seller_id,
        customer_id,
        product:products!inner(name, seller_id),
        customer:profiles!orders_customer_id_fkey(full_name)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    // If that fails, try without the inner join first to see if we can query orders at all
    if (error1) {
      console.log('Direct query failed, trying alternative query...');
      const { data: testData, error: testError } = await supabase
        .from('orders')
        .select('id, seller_id, customer_id, status')
        .eq('seller_id', user.id)
        .limit(5);
      
      if (testError) {
        console.error('Cannot query orders by seller_id:', testError);
        // Try fallback query
      } else {
        console.log('Test query successful, found orders:', testData?.length || 0);
        // Retry with full query but without inner join constraint
        const { data: retryData, error: retryError } = await supabase
          .from('orders')
          .select(`
            id,
            quantity,
            total_price,
            payment_method,
            status,
            created_at,
            delivery_address,
            seller_id,
            customer_id,
            product:products(name, seller_id),
            customer:profiles!orders_customer_id_fkey(full_name)
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!retryError && retryData) {
          data1 = retryData;
          error1 = null;
        }
      }
    }

    // Log errors for debugging
    if (error1) {
      console.error('Error fetching orders by seller_id:', error1);
      console.error('Error details:', JSON.stringify(error1, null, 2));
    }

    if (!error1 && data1) {
      ordersData = data1;
      console.log('Fetched orders by seller_id:', data1.length);
    } else {
      // Fallback: query by products seller_id if seller_id column doesn't exist on orders
      console.log('Trying fallback query by products.seller_id');
      const { data: data2, error: error2 } = await supabase
        .from('orders')
        .select(`
          id,
          quantity,
          total_price,
          payment_method,
          status,
          created_at,
          delivery_address,
          customer_id,
          seller_id,
          product:products!inner(name, seller_id),
          customer:profiles!orders_customer_id_fkey(full_name)
        `)
        .eq('products.seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error2) {
        console.error('Error fetching orders (fallback):', error2);
        console.error('Fallback error details:', JSON.stringify(error2, null, 2));
        orderError = error2;
      } else {
        ordersData = data2;
        console.log('Fetched orders by products.seller_id:', data2?.length || 0);
      }
    }

    // Fetch customer roles for each order to show if order is from customer or wholesaler
    if (ordersData && ordersData.length > 0) {
      const customerIds = [...new Set(ordersData.map(order => order.customer_id))];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', customerIds);

      // Map roles to orders
      if (rolesData) {
        const roleMap = new Map(rolesData.map(r => [r.user_id, r.role]));
        ordersData.forEach(order => {
          (order as any).customer_role = roleMap.get(order.customer_id);
        });
      }
    } else {
      console.log('No orders found for retailer:', user.id);
      console.log('Checking if seller_id column exists...');
      
      // Debug: Check if we can query orders at all
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders')
        .select('id, seller_id, customer_id, status')
        .limit(5);
      
      if (allOrdersError) {
        console.error('Cannot query orders table:', allOrdersError);
      } else {
        console.log('Sample orders (first 5):', allOrders);
        console.log('Current user ID:', user.id);
      }
    }

    if (ordersData) {
      const newOrders = ordersData.filter(order => !orderIdsRef.current.has(order.id));
      ordersData.forEach(order => orderIdsRef.current.add(order.id));

      // Calculate stats from ALL orders
      const totalRevenue = ordersData.length > 0 
        ? ordersData.reduce((sum, order) => sum + Number(order.total_price), 0)
        : 0;
      const pendingOrders = ordersData.length > 0
        ? ordersData.filter(order => order.status === 'pending').length
        : 0;
      setStats(prev => ({ ...prev, totalRevenue, pendingOrders }));
      
      console.log('Orders found:', ordersData.length, 'Pending:', pendingOrders);
      
      if (ordersData.length > 0) {
        // Show all orders (not just 5), with pending orders first
        const sortedOrders = [...ordersData].sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setRecentOrders(sortedOrders as unknown as RetailerOrder[]);

        if (hasMountedRef.current && newOrders.length > 0) {
          const first = newOrders[0] as RetailerOrder;
          toast.info('New order received', {
            description: `${first.customer?.full_name || 'Customer'} ordered ${first.quantity} ${first.product?.name || 'item(s)'}`
          });
        }
      } else {
        setRecentOrders([]);
      }
      hasMountedRef.current = true;
    } else if (orderError) {
      console.error('Failed to fetch orders:', orderError);
      setRecentOrders([]);
      setStats(prev => ({ ...prev, totalRevenue: 0, pendingOrders: 0 }));
    } else {
      // No orders found and no error - set empty state
      setRecentOrders([]);
      setStats(prev => ({ ...prev, totalRevenue: 0, pendingOrders: 0 }));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let channelRef: ReturnType<typeof supabase.channel> | undefined;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to all order changes, then filter in the callback
      // This works even if seller_id column doesn't exist yet
      channelRef = supabase
        .channel(`retailer-orders-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          async (payload) => {
            // For INSERT, check if order belongs to this retailer
            if (payload.eventType === 'INSERT') {
              const order = payload.new as any;
              
              // Check if seller_id matches (after migration)
              if (order.seller_id === user.id) {
                toast.info("New order received", {
                  description: `Customer ordered ${order.quantity} unit(s).`,
                });
                fetchData();
                return;
              }
              
              // Fallback: check via product if seller_id doesn't exist yet
              if (!order.seller_id) {
                const { data: product } = await supabase
                  .from('products')
                  .select('seller_id')
                  .eq('id', order.product_id)
                  .single();
                
                if (product?.seller_id === user.id) {
                  toast.info("New order received", {
                    description: `Customer ordered ${order.quantity} unit(s).`,
                  });
                  fetchData();
                }
              }
            }

            if (payload.eventType === 'UPDATE') {
              const order = payload.new as any;
              
              // Only update if this order belongs to us
              if (order.seller_id === user.id || !order.seller_id) {
                setRecentOrders((prev) => {
                  const existing = prev.find(o => o.id === order.id);
                  if (existing) {
                    return prev.map((o) =>
                      o.id === order.id
                        ? { ...o, status: order.status as OrderStatus }
                        : o
                    );
                  }
                  return prev;
                });
                fetchData();
              }
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channelRef) {
        supabase.removeChannel(channelRef);
      }
    };
  }, [fetchData]);

  const updateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', orderId);

    if (error) {
      toast.error("Unable to update order", {
        description: error.message,
      });
    } else {
      toast.success("Order updated", {
        description: `Status changed to ${nextStatus.replace(/_/g, ' ')}`,
      });
      setRecentOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order
        )
      );
      fetchData();
    }
    setUpdatingOrderId(null);
  };

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
          <h2 className="text-2xl font-bold">All Orders</h2>
          {stats.pendingOrders > 0 && (
            <Alert className="w-full md:w-auto border-orange-200 bg-orange-50">
              <Bell className="h-4 w-4" />
              <AlertTitle>Pending Orders</AlertTitle>
              <AlertDescription>
                You have {stats.pendingOrders} pending order{stats.pendingOrders === 1 ? '' : 's'} awaiting action.
              </AlertDescription>
            </Alert>
          )}
        </div>
        {recentOrders.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No orders yet. New orders will appear here as soon as customers or wholesalers buy your products.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {recentOrders.map((order) => {
              const isPending = order.status === 'pending';
              const isFromWholesaler = order.customer_role === 'wholesaler';
              return (
              <Card key={order.id} className={isPending ? 'border-orange-300 border-2' : ''}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Order ID</p>
                        <p className="font-semibold text-xs">{order.id.slice(0, 8)}...</p>
                      </div>
                      {isPending && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                          PENDING
                        </span>
                      )}
                      {isFromWholesaler && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-300">
                          WHOLESALER
                        </span>
                      )}
                    </div>
                    <span className={`text-sm capitalize px-3 py-1 rounded-full ${
                      order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'on_the_way' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <OrderStatusTracker status={order.status} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">
                        {isFromWholesaler ? 'Wholesaler' : 'Customer'}
                      </p>
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
                  <div className="flex flex-wrap gap-2 pt-2">
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'dispatched')}
                        disabled={updatingOrderId === order.id}
                      >
                        Mark as Dispatched
                      </Button>
                    )}
                    {order.status === 'dispatched' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, 'on_the_way')}
                        disabled={updatingOrderId === order.id}
                      >
                        Mark as On Its Way
                      </Button>
                    )}
                    {order.status === 'on_the_way' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateOrderStatus(order.id, 'received')}
                        disabled={updatingOrderId === order.id}
                      >
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            })}
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
