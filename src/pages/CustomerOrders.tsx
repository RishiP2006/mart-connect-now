import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusTracker, OrderStatus } from "@/components/OrderStatusTracker";
import { Loader2, PackageSearch, RefreshCcw } from "lucide-react";
import { format } from "date-fns";

interface OrderRecord {
  id: string;
  status: OrderStatus;
  total_price: number;
  created_at: string;
  delivery_address: string;
  payment_method: string;
  quantity: number;
  products: {
    name: string;
    image_url?: string;
  } | null;
}

type StatusFilter = OrderStatus | "all";

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Dispatched", value: "dispatched" },
  { label: "On the Way", value: "on_the_way" },
  { label: "Delivered", value: "received" },
];

const CustomerOrders = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      await fetchOrders(user.id);
      channel = subscribeToOrders(user.id);
    };

    init();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchOrders = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        total_price,
        created_at,
        delivery_address,
        payment_method,
        quantity,
        products (
          name,
          image_url
        )
      `)
      .eq("customer_id", uid)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as unknown as OrderRecord[]);
    }
    setLoading(false);
  };

  const subscribeToOrders = (uid: string) => {
    const channel = supabase
      .channel(`customer-orders-page-${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${uid}`,
        },
        () => {
          fetchOrders(uid);
        }
      )
      .subscribe();

    return channel;
  };

  const filteredOrders = useMemo(() => {
    if (selectedStatus === "all") return orders;
    return orders.filter((order) => order.status === selectedStatus);
  }, [orders, selectedStatus]);

  const handleRefresh = () => {
    if (userId) {
      fetchOrders(userId);
    }
  };

  return (
    <>
      <DashboardHeader title="My Orders" role="customer" />
      <main className="container mx-auto px-6 py-8 space-y-6">
        <header className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Track every order</h1>
              <p className="text-muted-foreground">
                View live updates for all your purchases anytime.
              </p>
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={
                  selectedStatus === filter.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedStatus(filter.value)}
              >
                {filter.label}
                {filter.value === "all" ? (
                  orders.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-primary/10 text-primary"
                    >
                      {orders.length}
                    </Badge>
                  )
                ) : (
                  orders.filter((order) => order.status === filter.value).length >
                    0 && (
                    <Badge variant="secondary" className="ml-2">
                      {
                        orders.filter(
                          (order) => order.status === filter.value
                        ).length
                      }
                    </Badge>
                  )
                )}
              </Button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading your orders...
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="min-h-[40vh] flex flex-col items-center justify-center text-center space-y-4">
            <PackageSearch className="h-12 w-12 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">No orders yet</h2>
              <p className="text-muted-foreground">
                Place an order to start tracking its progress here.
              </p>
            </div>
            <Button asChild>
              <Link to="/products">Browse products</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {order.products?.name || "Order"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Ordered on {format(new Date(order.created_at), "PPP")} ·{" "}
                      {order.quantity} item{order.quantity === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge className="capitalize">
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <OrderStatusTracker status={order.status} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs uppercase text-muted-foreground">
                        Delivery address
                      </p>
                      <p className="text-sm">{order.delivery_address}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs uppercase text-muted-foreground">
                        Payment
                      </p>
                      <p className="text-sm capitalize">
                        {order.payment_method === "online"
                          ? "Online"
                          : "Cash on Delivery"}
                      </p>
                      <p className="text-sm font-semibold">
                        ${Number(order.total_price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default CustomerOrders;

