import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OrderConfirmationState {
  orderId?: string;
  totalPrice?: number;
  paymentMethod?: string;
  deliveryAddress?: string;
  items?: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as OrderConfirmationState;
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        setUserRole(data?.role || null);
      }
    };
    fetchRole();
  }, []);

  const paymentLabel =
    state.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery";

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={userRole} />
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Card className="shadow-[var(--shadow-soft)]">
          <CardHeader className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <CardTitle className="text-3xl">Order Confirmed!</CardTitle>
            <p className="text-muted-foreground">
              Thank you for your purchase. We’ve notified the retailer and
              we’ll keep you posted on the delivery.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {state.orderId && (
              <div className="rounded-lg border p-4 bg-muted/40">
                <p className="text-xs uppercase text-muted-foreground">
                  Order ID
                </p>
                <p className="font-semibold">{state.orderId}</p>
              </div>
            )}

            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium">{paymentLabel}</span>
              </div>
              {state.totalPrice !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold text-lg">
                    ${state.totalPrice.toFixed(2)}
                  </span>
                </div>
              )}
              {state.deliveryAddress && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Delivery Address</p>
                  <p className="font-medium">{state.deliveryAddress}</p>
                </div>
              )}
            </div>

            {state.items && state.items.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Items in this order
                </h3>
                <div className="space-y-2">
                  {state.items.map((item, idx) => (
                    <div
                      key={`${item.productName}-${idx}`}
                      className="flex justify-between text-sm border rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={() => navigate("/products")}>
                Continue Shopping
              </Button>
              <Button onClick={() => navigate("/customer")} className="gap-2">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderConfirmation;


