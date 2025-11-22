import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [productStock, setProductStock] = useState<Record<string, { stock: number; name: string }>>({});
  const [formData, setFormData] = useState({
    delivery_address: '',
    payment_method: 'offline',
  });
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
    fetchUserRole();
    fetchProductStock();
  }, [items]);

  const fetchProductStock = async () => {
    if (items.length === 0) return;
    
    const productIds = items.map(item => item.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('id, name, stock_quantity')
      .in('id', productIds);

    if (products) {
      const stockMap: Record<string, { stock: number; name: string }> = {};
      products.forEach(product => {
        stockMap[product.id] = {
          stock: product.stock_quantity,
          name: product.name,
        };
      });
      setProductStock(stockMap);
    }
  };

  const fetchUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      setUserRole(data?.role || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to place an order',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // STEP 1: Validate stock availability BEFORE creating orders
      const stockValidationErrors: string[] = [];
      const productsToUpdate: Array<{ id: string; currentStock: number; requestedQuantity: number }> = [];

      for (const item of items) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name, stock_quantity, seller_id')
          .eq('id', item.product_id)
          .single();

        if (productError || !product) {
          stockValidationErrors.push(`${item.product_name}: Product not found`);
          continue;
        }

        if (product.stock_quantity < item.quantity) {
          stockValidationErrors.push(
            `${item.product_name}: Only ${product.stock_quantity} available, but ${item.quantity} requested`
          );
          continue;
        }

        if (product.stock_quantity === 0) {
          stockValidationErrors.push(`${item.product_name}: Out of stock`);
          continue;
        }

        productsToUpdate.push({
          id: item.product_id,
          currentStock: product.stock_quantity,
          requestedQuantity: item.quantity,
        });
      }

      // If any items are out of stock, show error and stop
      if (stockValidationErrors.length > 0) {
        toast({
          title: 'Out of Stock',
          description: stockValidationErrors.join('. '),
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // STEP 2: Create orders (only if all stock is available)
      const orders = items.map((item) => ({
        customer_id: session.user.id,
        product_id: item.product_id,
        quantity: item.quantity,
        total_price: item.product_price * item.quantity,
        delivery_address: formData.delivery_address,
        payment_method: formData.payment_method,
        status: 'pending',
        seller_id: item.seller_id,
      }));

      // Insert orders
      const { data: insertedOrders, error: orderError } = await supabase.from('orders').insert(orders).select();

      if (orderError) {
        console.error('Error creating orders:', orderError);
        throw orderError;
      }

      // Get the first order ID for email (if multiple orders, use the first one)
      const orderId = insertedOrders?.[0]?.id || undefined;

      // STEP 3: Update stock for each product (only if orders were created successfully)
      for (const productUpdate of productsToUpdate) {
        const newStock = productUpdate.currentStock - productUpdate.requestedQuantity;
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', productUpdate.id)
          .eq('stock_quantity', productUpdate.currentStock); // Optimistic locking to prevent race conditions

        if (stockError) {
          console.error('Error updating stock for product:', productUpdate.id, stockError);
          // If stock update fails, we should ideally rollback orders, but for now just log
          toast({
            title: 'Warning',
            description: `Stock update failed for one or more products. Please contact support.`,
            variant: 'destructive',
          });
        }
      }

      const orderItems = items.map((item) => ({
        productName: item.product_name,
        quantity: item.quantity,
        price: item.product_price,
      }));

      // Send email notification
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();

        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email) {
          // Prepare order items for email
          // Send order confirmation email
          const emailSent = await sendOrderConfirmationEmail({
            to: user.email,
            customerName: profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0] || 'Customer',
            orderItems,
            totalPrice,
            deliveryAddress: formData.delivery_address,
            paymentMethod: formData.payment_method,
            orderId: orderId,
          });

          if (emailSent) {
            console.log('Order confirmation email sent successfully to:', user.email);
          } else {
            console.warn('Email service not configured. Order confirmation email was not sent.');
          }
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the order if email fails
      }

      toast({
        title: 'Order placed successfully!',
        description: 'You will receive updates on your order status',
      });

      clearCart();
      navigate('/order-confirmation', {
        state: {
          orderId,
          totalPrice,
          paymentMethod: formData.payment_method,
          deliveryAddress: formData.delivery_address,
          items: orderItems,
        },
      });
    } catch (error: any) {
      toast({
        title: 'Error placing order',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={userRole} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter your full delivery address"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                    required
                  />
                </div>
                {formData.payment_method === 'offline' && (
                  <div className="space-y-2">
                    <Label>Preferred Delivery Date (Optional)</Label>
                    <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deliveryDate ? format(deliveryDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={deliveryDate}
                          onSelect={(date) => {
                            setDeliveryDate(date);
                            setShowCalendar(false);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {deliveryDate && (
                      <p className="text-sm text-muted-foreground">
                        You'll receive a reminder before delivery
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Cash on Delivery (Offline)</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => {
                    const stockInfo = productStock[item.product_id];
                    const isOutOfStock = stockInfo && stockInfo.stock === 0;
                    const isLowStock = stockInfo && stockInfo.stock > 0 && stockInfo.stock < item.quantity;
                    const isInStock = stockInfo && stockInfo.stock >= item.quantity;
                    
                    return (
                      <div key={item.id} className="flex justify-between items-start text-sm border-b pb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span>
                              {item.product_name} x {item.quantity}
                            </span>
                            {isOutOfStock && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                                Out of Stock
                              </span>
                            )}
                            {isLowStock && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                                Only {stockInfo.stock} available
                              </span>
                            )}
                            {isInStock && stockInfo && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                {stockInfo.stock} in stock
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold ml-2">
                          ${(item.product_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/cart')}
                >
                  Back to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;