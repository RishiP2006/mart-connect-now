import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, MapPin, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  distance?: number;
  sellerName?: string;
  sellerLocation?: string;
}

export const ProductCard = ({ 
  id, 
  name, 
  description, 
  price, 
  image_url, 
  stock_quantity,
  distance,
  sellerName,
  sellerLocation
}: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="group overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:-translate-y-1 cursor-pointer"
      onClick={() => navigate(`/products/${id}`)}
    >
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="h-16 w-16 text-muted-foreground/20" />
            </div>
          )}
          {stock_quantity === 0 && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <span className="text-destructive font-semibold">Out of Stock</span>
            </div>
          )}
          {distance !== undefined && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {distance.toFixed(1)} km
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{description}</p>
        )}
        
        {(sellerName || sellerLocation) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Store className="h-3 w-3" />
            <span className="line-clamp-1">
              {sellerName}
              {sellerLocation && ` • ${sellerLocation}`}
            </span>
          </div>
        )}
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">${price}</span>
          <span className="text-xs text-muted-foreground">{stock_quantity} in stock</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          disabled={stock_quantity === 0}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/products/${id}`);
          }}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};