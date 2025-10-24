import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductWithLocation {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  seller_id: string;
  category_id: string | null;
  created_at: string;
  distance?: number;
  seller_name?: string;
  seller_location?: string;
  profiles?: any;
}

const Products = () => {
  const [products, setProducts] = useState<ProductWithLocation[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRole();
    fetchCategories();
    fetchProducts();
  }, []);

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

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getUserLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
        toast({
          title: "Location enabled",
          description: "Showing products near you",
        });
      },
      (error) => {
        setLocationLoading(false);
        toast({
          title: "Location access denied",
          description: "Please enable location to see nearby products",
          variant: "destructive",
        });
      }
    );
  };

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select(`
        *,
        profiles:seller_id (
          full_name,
          location_lat,
          location_lng,
          address
        )
      `)
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    const { data } = await query;
    
    let productsWithLocation = (data || []).map((product: any) => ({
      ...product,
      seller_name: product.profiles?.full_name,
      seller_location: product.profiles?.address,
      distance: userLocation && product.profiles?.location_lat && product.profiles?.location_lng
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            Number(product.profiles.location_lat),
            Number(product.profiles.location_lng)
          )
        : undefined,
    }));

    // Sort by distance if user location is available
    if (userLocation) {
      productsWithLocation = productsWithLocation.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    setProducts(productsWithLocation);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, userLocation]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={userRole} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Products</h1>
          <p className="text-muted-foreground">Discover products from local retailers and wholesalers</p>
          
          <div className="mt-4">
            <Button 
              onClick={getUserLocation} 
              disabled={locationLoading}
              variant={userLocation ? "secondary" : "default"}
              className="gap-2"
            >
              {userLocation ? (
                <>
                  <MapPin className="h-4 w-4" />
                  Location enabled
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  {locationLoading ? "Getting location..." : "Enable location for nearby products"}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                {...product}
                distance={product.distance}
                sellerName={product.seller_name}
                sellerLocation={product.seller_location}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;