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
  const [cityName, setCityName] = useState('');
  const [currentCity, setCurrentCity] = useState('');
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

  const searchCityLocation = async () => {
    if (!cityName.trim()) {
      toast({
        title: "Enter a city name",
        description: "Please enter a city name to search",
        variant: "destructive",
      });
      return;
    }

    setLocationLoading(true);
    
    try {
      // Use Nominatim geocoding API (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setUserLocation(location);
        setCurrentCity(data[0].display_name);
        toast({
          title: "Location found",
          description: `Showing products near ${data[0].display_name}`,
        });
      } else {
        toast({
          title: "City not found",
          description: "Please try a different city name",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find city location",
        variant: "destructive",
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // 1) Fetch products (optionally by category)
      let productsQuery = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        productsQuery = productsQuery.eq('category_id', selectedCategory);
      }

      const { data: productsData, error: productsError } = await productsQuery;

      if (productsError) {
        console.error('Error fetching products:', productsError);
        setProducts([]);
        return;
      }

      const baseProducts = productsData || [];

      // 2) Fetch seller profiles for these products and merge client-side
      const sellerIds = Array.from(new Set(baseProducts.map((p: any) => p.seller_id).filter(Boolean)));

      let profileMap = new Map<string, any>();
      if (sellerIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, location_lat, location_lng, address')
          .in('id', sellerIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          profileMap = new Map((profilesData || []).map((pr: any) => [pr.id, pr]));
        }
      }

      let productsWithLocation = baseProducts.map((product: any) => {
        const profile = profileMap.get(product.seller_id);
        const lat = profile?.location_lat ? Number(profile.location_lat) : undefined;
        const lng = profile?.location_lng ? Number(profile.location_lng) : undefined;

        return {
          ...product,
          seller_name: profile?.full_name,
          seller_location: profile?.address,
          distance:
            userLocation && lat !== undefined && lng !== undefined
              ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
              : undefined,
        } as ProductWithLocation;
      });

      if (userLocation) {
        productsWithLocation = productsWithLocation.sort((a, b) => {
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return (a.distance as number) - (b.distance as number);
        });
      }

      setProducts(productsWithLocation);
    } finally {
      setLoading(false);
    }
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
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="Enter your city name..."
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCityLocation()}
                className="flex-1"
              />
              <Button 
                onClick={searchCityLocation} 
                disabled={locationLoading}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                {locationLoading ? "Searching..." : "Search"}
              </Button>
            </div>
            {currentCity && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing products near: <span className="font-medium">{currentCity}</span>
              </p>
            )}
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