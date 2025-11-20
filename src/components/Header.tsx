import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Package, LogOut } from 'lucide-react';
import { CartDrawer } from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  userRole?: string | null;
}

export const Header = ({ userRole }: HeaderProps) => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const canBrowseProducts = userRole !== 'retailer';
  const canUseCart = userRole === 'customer';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1
            className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            Live MART
          </h1>
          <nav className="hidden md:flex items-center gap-6">
            {canBrowseProducts && (
              <Button variant="ghost" onClick={() => navigate('/products')}>
                Browse Products
              </Button>
            )}
            {(userRole === 'retailer' || userRole === 'wholesaler') && (
              <Button variant="ghost" onClick={() => navigate('/seller/products')}>
                My Products
              </Button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {canUseCart && (
            <>
              {/* Existing local cart button */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/cart')}
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {totalItems}
                  </Badge>
                )}
              </Button>

              {/* Shopify cart drawer trigger */}
              <CartDrawer />
            </>
          )}

          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};