import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/stores/cartStore';
import { fetchProductByHandle, ShopifyProductNode } from '@/lib/shopify';

const updateHeadTags = (title: string, description: string, canonicalUrl: string, product?: ShopifyProductNode) => {
  document.title = title;

  let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = description.slice(0, 155);

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;

  // Structured data
  const scriptId = 'ld-json-product';
  let ld = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!ld) {
    ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = scriptId;
    document.head.appendChild(ld);
  }
  if (product) {
    const imageUrl = product.images?.edges?.[0]?.node?.url;
    ld.text = JSON.stringify({
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.title,
      description: product.description,
      image: imageUrl ? [imageUrl] : [],
      offers: {
        '@type': 'Offer',
        priceCurrency: product.priceRange?.minVariantPrice?.currencyCode,
        price: product.priceRange?.minVariantPrice?.amount,
        availability: 'https://schema.org/InStock',
      },
    });
  }
};

export default function ShopifyProductDetail() {
  const { handle } = useParams();
  const [product, setProduct] = useState<ShopifyProductNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((s) => s.addItem);
  const createCheckout = useCartStore((s) => s.createCheckout);

  useEffect(() => {
    const run = async () => {
      if (!handle) return;
      setLoading(true);
      try {
        const p = await fetchProductByHandle(handle);
        if (!p) {
          setError('Product not found');
        } else {
          setProduct(p);
          setError(null);
          const url = window.location.origin + `/shopify/${handle}`;
          updateHeadTags(`${p.title} | Live MART`, p.description || p.title, url, p);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [handle]);

  const selectedVariant = useMemo(() => {
    const edges = product?.variants?.edges || [];
    if (!edges.length) return null;
    // Prefer first available variant
    const availableIdx = edges.findIndex((e) => e.node.availableForSale);
    const index = availableIdx !== -1 ? availableIdx : 0;
    return edges[selectedVariantIndex] ? edges[selectedVariantIndex].node : edges[index].node;
  }, [product, selectedVariantIndex]);

  const priceDisplay = selectedVariant
    ? `${selectedVariant.price.currencyCode} ${parseFloat(selectedVariant.price.amount).toFixed(2)}`
    : product?.priceRange
    ? `${product.priceRange.minVariantPrice.currencyCode} ${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}`
    : '';

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    addItem({
      product: {
        // Align with CartDrawer expectations
        title: product.title,
        images: product.images,
      },
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
  };

  const handleBuyNow = async () => {
    handleAddToCart();
    await createCheckout();
    const checkoutUrl = (await import('@/stores/cartStore')).useCartStore.getState().checkoutUrl;
    if (checkoutUrl) window.open(checkoutUrl, '_blank');
  };

  if (loading) return <div className="container mx-auto p-6">Loading...</div>;
  if (error) return <div className="container mx-auto p-6">{error}</div>;
  if (!product) return <div className="container mx-auto p-6">Product not found</div>;

  const image = product.images?.edges?.[0]?.node;

  return (
    <main className="container mx-auto p-6">
      <article className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-square w-full bg-secondary/20 overflow-hidden">
              {image?.url ? (
                <img src={image.url} alt={image.altText || product.title} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
          </CardContent>
        </Card>

        <section>
          <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
          <p className="text-muted-foreground mb-4">{product.description}</p>

          <div className="text-xl font-semibold mb-4">{priceDisplay}</div>

          {product.variants?.edges?.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm mb-1">Variant</label>
              <select
                className="w-full border rounded-md px-3 py-2 bg-background"
                value={selectedVariantIndex}
                onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
              >
                {product.variants.edges.map((v, idx) => (
                  <option key={v.node.id} value={idx}>
                    {v.node.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm mb-1">Quantity</label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-28"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleAddToCart} disabled={!selectedVariant}>Add to cart</Button>
            <Button variant="secondary" onClick={handleBuyNow} disabled={!selectedVariant}>
              Buy now with Shopify
            </Button>
          </div>
        </section>
      </article>
    </main>
  );
}
