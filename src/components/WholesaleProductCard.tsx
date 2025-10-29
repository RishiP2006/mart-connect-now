import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { TrendingDown } from 'lucide-react';

interface WholesaleProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    wholesale_price?: number;
    image_url: string;
    stock_quantity: number;
  };
}

export const WholesaleProductCard = ({ product }: WholesaleProductCardProps) => {
  const savings = product.wholesale_price 
    ? ((product.price - product.wholesale_price) / product.price * 100).toFixed(0)
    : 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0 relative">
        {savings && Number(savings) > 0 && (
          <Badge className="absolute top-2 right-2 z-10 bg-green-500">
            <TrendingDown className="h-3 w-3 mr-1" />
            {savings}% off
          </Badge>
        )}
        <div className="aspect-square w-full bg-secondary/20 overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold leading-snug line-clamp-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description || '—'}
        </p>
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-green-600">
              ${product.wholesale_price}
            </span>
            <span className="text-sm text-muted-foreground line-through">
              ${product.price}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Wholesale pricing available</p>
          <p className="text-xs text-muted-foreground">
            {product.stock_quantity} units available
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="default" className="w-full" asChild>
          <Link to={`/product/${product.id}`}>Order Wholesale</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
