import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface ShopifyImageNode {
  url: string;
  altText: string | null;
}

interface ShopifyProductNode {
  id: string;
  title: string;
  description: string;
  handle: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{ node: ShopifyImageNode }>;
  };
}

interface ShopifyProductCardProps {
  product: ShopifyProductNode;
}

export const ShopifyProductCard = ({ product }: ShopifyProductCardProps) => {
  const image = product.images?.edges?.[0]?.node as ShopifyImageNode | undefined;
  const price = product.priceRange?.minVariantPrice;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="aspect-square w-full bg-secondary/20 overflow-hidden">
          {image?.url ? (
            <img
              src={image.url}
              alt={image.altText || product.title}
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
        <h3 className="font-semibold leading-snug line-clamp-2">{product.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description || '—'}
        </p>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`h-3 w-3 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">4.5 (18 reviews)</span>
        </div>
        <p className="text-xs text-muted-foreground">12 items left</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="font-bold">
          {price?.currencyCode || 'USD'} {price?.amount ? Number(price.amount).toFixed(2) : '—'}
        </span>
        <Button variant="secondary" asChild>
          <a href={`/shopify/${product.handle}`} aria-label={`View ${product.title}`}>
            View
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};
