import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { ProductManagementDialog } from './ProductManagementDialog';
import { toast } from 'sonner';

interface RetailerProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    wholesale_price?: number;
    image_url: string;
    stock_quantity: number;
  };
  onUpdate: () => void;
}

export const RetailerProductCard = ({ product, onUpdate }: RetailerProductCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;
      toast.success('Product deleted successfully');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
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
          <div className="space-y-1">
            <p className="text-lg font-bold">${product.price}</p>
            {product.wholesale_price && (
              <p className="text-sm text-muted-foreground">
                Wholesale: ${product.wholesale_price}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Stock: {product.stock_quantity}</p>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setDialogOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <ProductManagementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onUpdate}
        product={product}
      />
    </>
  );
};
