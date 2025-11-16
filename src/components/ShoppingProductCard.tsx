import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ShoppingProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    stock_quantity: number;
  };
}

export const ShoppingProductCard = ({ product }: ShoppingProductCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
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
        <p className="text-lg font-bold">${product.price}</p>
        <p className="text-xs text-muted-foreground">
          {product.stock_quantity > 0 
            ? `${product.stock_quantity} ${product.name.toLowerCase()} left` 
            : 'Out of stock'}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="default" className="w-full" asChild>
          <Link to={`/product/${product.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
