import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ShopifyProductCard } from '@/components/ShopifyProductCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, MapPin, Navigation, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { haversineDistanceKm, searchGeoJsonLocation } from '@/lib/geolocation';

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
  availability_date?: string | null;
  distance?: number;
  seller_name?: string;
  seller_location?: string;
  profiles?: any;
}

interface RetailerLocationSummary {
  id: string;
  name?: string;
  address?: string;
  lat: number;
  lng: number;
  distance: number;
}

const DEFAULT_NEARBY_DISTANCE_KM = 5;

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
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualLocationLoading, setManualLocationLoading] = useState(false);
  const [browserLocationLoading, setBrowserLocationLoading] = useState(false);
  const [showManualInputs, setShowManualInputs] = useState(false);
  const [nearbyRetailers, setNearbyRetailers] = useState<RetailerLocationSummary[]>([]);
  const { toast } = useToast();

  const [shopifyProducts, setShopifyProducts] = useState<any[]>([]);
  const [shopifyLoading, setShopifyLoading] = useState(false);
  
  // Enhanced filtering state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [quantityRange, setQuantityRange] = useState<[number, number]>([0, 500]);
  const [maxDistance, setMaxDistance] = useState<number>(DEFAULT_NEARBY_DISTANCE_KM);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOption, setSortOption] = useState<'relevance' | 'price-asc' | 'price-desc' | 'qty-asc' | 'qty-desc'>('relevance');
  
  // Update price range when products load
  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => p.price);
      const quantities = products.map(p => p.stock_quantity);
      const maxPriceValue = Math.max(...prices, 1000);
      const minPriceValue = Math.min(...prices, 0);
      const maxQuantityValue = Math.max(...quantities, 100);

      setPriceRange(([currentMin, currentMax]) => [
        Math.min(currentMin, minPriceValue),
        Math.max(currentMax, maxPriceValue),
      ]);

      setQuantityRange(([currentMin, currentMax]) => [
        Math.min(currentMin, 0),
        Math.max(currentMax, maxQuantityValue),
      ]);
    }
  }, [products]);

  useEffect(() => {
    fetchUserRole();
    fetchCategories();
    fetchProducts();
    fetchShopifyProducts();
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

  const applyUserLocation = (location: { lat: number; lng: number }, label?: string) => {
    setUserLocation(location);
    setCurrentCity(label ?? '');
    setMaxDistance(DEFAULT_NEARBY_DISTANCE_KM);
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
      const results = await searchGeoJsonLocation(cityName, 1);

      if (results.length > 0) {
        const match = results[0];
        applyUserLocation({ lat: match.lat, lng: match.lng }, match.displayName);
        toast({
          title: "Location found",
          description: `Showing products near ${match.displayName}`,
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

  const handleManualLocation = async () => {
    if (!manualLat || !manualLng) {
      toast({
        title: "Missing coordinates",
        description: "Please enter both latitude and longitude",
        variant: "destructive",
      });
      return;
    }

    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      toast({
        title: "Invalid coordinates",
        description: "Latitude and longitude must be valid numbers",
        variant: "destructive",
      });
      return;
    }

    setManualLocationLoading(true);
    try {
      applyUserLocation({ lat, lng }, `Custom (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
      toast({
        title: "Location set",
        description: "Using your custom coordinates",
      });
    } finally {
      setManualLocationLoading(false);
    }
  };

  const handleBrowserLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation",
        variant: "destructive",
      });
      return;
    }

    setBrowserLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        applyUserLocation(
          { lat: coords.latitude, lng: coords.longitude },
          `My Location (${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)})`
        );
        toast({
          title: "Location detected",
          description: "Using your current location",
        });
        setBrowserLocationLoading(false);
      },
      () => {
        toast({
          title: "Unable to access location",
          description: "Please allow location permissions and try again",
          variant: "destructive",
        });
        setBrowserLocationLoading(false);
      }
    );
  };

  // Fetch Shopify products via Storefront API
  const fetchShopifyProducts = async () => {
    setShopifyLoading(true);
    try {
      const SHOPIFY_STORE_PERMANENT_DOMAIN = 'mart-connect-now-ozguo.myshopify.com';
      const SHOPIFY_API_VERSION = '2025-07';
      const SHOPIFY_STOREFRONT_TOKEN = 'e96f15bb99fa3bd3ebcd9682b4aaca17';

      const response = await fetch(`https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query: `query GetProducts($first: Int!) {\n            products(first: $first) {\n              edges {\n                node {\n                  id\n                  title\n                  description\n                  handle\n                  priceRange { minVariantPrice { amount currencyCode } }\n                  images(first: 1) { edges { node { url altText } } }\n                }\n              }\n            }\n          }`,
          variables: { first: 24 },
        }),
      });

      const data = await response.json();
      const edges = data?.data?.products?.edges || [];
      setShopifyProducts(edges);
    } catch (e) {
      console.error('Shopify fetch error:', e);
    } finally {
      setShopifyLoading(false);
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
          .select('id, full_name, location_lat, location_lng, address, location_geojson')
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
              ? haversineDistanceKm(userLocation.lat, userLocation.lng, lat, lng)
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

      if (userLocation && profileMap.size > 0) {
        const nearby = Array.from(profileMap.values())
          .filter((profile: any) => profile?.location_lat && profile?.location_lng)
          .map((profile: any) => {
            const lat = Number(profile.location_lat);
            const lng = Number(profile.location_lng);
            return {
              id: profile.id,
              name: profile.full_name,
              address: profile.address,
              lat,
              lng,
              distance: haversineDistanceKm(userLocation.lat, userLocation.lng, lat, lng),
            } as RetailerLocationSummary;
          })
          .filter((retailer) => retailer.distance <= DEFAULT_NEARBY_DISTANCE_KM)
          .sort((a, b) => a.distance - b.distance);
        setNearbyRetailers(nearby);
      } else {
        setNearbyRetailers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, userLocation]);

  // Get max price for slider
  const maxPrice = products.length > 0 
    ? Math.max(...products.map(p => p.price), 1000)
    : 1000;
  const minPrice = products.length > 0
    ? Math.min(...products.map(p => p.price), 0)
    : 0;
  const minQuantity = products.length > 0
    ? Math.min(...products.map(p => p.stock_quantity), 0)
    : 0;

  const maxQuantity = products.length > 0
    ? Math.max(...products.map(p => p.stock_quantity), 100)
    : 100;

  const filteredProducts = products.filter((product) => {
    // Search filter
    const productName = (product.name ?? '').toLowerCase();
    const matchesSearch = productName.includes(searchQuery.toLowerCase());
    
    // Price filter
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    // Stock filter
    const matchesStock = !showInStockOnly || product.stock_quantity > 0;

    // Quantity filter
    const matchesQuantity = product.stock_quantity >= quantityRange[0] && product.stock_quantity <= quantityRange[1];
    
    // Distance filter
    const matchesDistance = !userLocation || product.distance === undefined || product.distance <= maxDistance;
    
    return matchesSearch && matchesPrice && matchesStock && matchesQuantity && matchesDistance;
  });

  const sortedProducts = filteredProducts.slice().sort((a, b) => {
    switch (sortOption) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'qty-asc':
        return a.stock_quantity - b.stock_quantity;
      case 'qty-desc':
        return b.stock_quantity - a.stock_quantity;
      default:
        return 0;
    }
  });
  
  const filteredShopifyProducts = shopifyProducts.filter((edge: any) =>
    edge?.node?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={userRole} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Products</h1>
          <p className="text-muted-foreground">Discover products from local retailers and wholesalers</p>
          
          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 max-w-md">
                <Input
                  placeholder="Search your city or address..."
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
              <div className="flex flex-wrap gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleBrowserLocation}
                  disabled={browserLocationLoading}
                  className="gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  {browserLocationLoading ? 'Locating...' : 'Use my location'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowManualInputs((prev) => !prev)}
                >
                  {showManualInputs ? 'Hide manual entry' : 'Enter coordinates manually'}
                </Button>
              </div>
            </div>
            {showManualInputs && (
              <div className="grid gap-2 sm:grid-cols-3 max-w-2xl">
                <Input
                  type="number"
                  placeholder="Latitude"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Longitude"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={handleManualLocation}
                  disabled={manualLocationLoading}
                >
                  {manualLocationLoading ? 'Setting...' : 'Set location'}
                </Button>
              </div>
            )}
            {currentCity && (
              <p className="text-sm text-muted-foreground">
                Showing retailers within {DEFAULT_NEARBY_DISTANCE_KM} km of: <span className="font-medium">{currentCity}</span>
              </p>
            )}
          </div>
        </div>

        {userLocation && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nearby Retailers (within {DEFAULT_NEARBY_DISTANCE_KM} km)</CardTitle>
            </CardHeader>
            <CardContent>
              {nearbyRetailers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No retailers registered within {DEFAULT_NEARBY_DISTANCE_KM} km yet. Check back soon!
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {nearbyRetailers.map((retailer) => (
                    <div
                      key={retailer.id}
                      className="rounded-lg border p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{retailer.name || 'Retailer'}</p>
                          <p className="text-sm text-muted-foreground">{retailer.address || 'Address not provided'}</p>
                        </div>
                        <span className="text-sm font-medium">{retailer.distance.toFixed(1)} km</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          window.open(`https://www.google.com/maps/search/?api=1&query=${retailer.lat},${retailer.lng}`, '_blank');
                        }}
                      >
                        <Navigation className="h-4 w-4" />
                        Directions
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
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

            <Select value={sortOption} onValueChange={(value) => setSortOption(value as typeof sortOption)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Sort: Relevance</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="qty-desc">Quantity: High to Low</SelectItem>
                <SelectItem value="qty-asc">Quantity: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Filter Products</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price Range Filter */}
                  <div className="space-y-2">
                    <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                    <Slider
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      min={minPrice}
                      max={maxPrice}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${minPrice}</span>
                      <span>${maxPrice}</span>
                    </div>
                  </div>

                  {/* Quantity Filter */}
                  <div className="space-y-2">
                    <Label>Quantity Range: {quantityRange[0]} - {quantityRange[1]} units</Label>
                    <Slider
                      value={quantityRange}
                      onValueChange={(value) => setQuantityRange(value as [number, number])}
                      min={Math.min(minQuantity, 0)}
                      max={maxQuantity}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{Math.min(minQuantity, 0)} units</span>
                      <span>{maxQuantity} units</span>
                    </div>
                  </div>

                  {/* Stock Availability Filter */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inStock"
                      checked={showInStockOnly}
                      onCheckedChange={(checked) => setShowInStockOnly(checked === true)}
                    />
                    <Label htmlFor="inStock" className="cursor-pointer">
                      Show only in-stock items
                    </Label>
                  </div>

                  {/* Distance Filter */}
                  {userLocation && (
                    <div className="space-y-2">
                      <Label>Maximum Distance: {maxDistance} km</Label>
                      <Slider
                        value={[maxDistance]}
                        onValueChange={(value) => setMaxDistance(value[0])}
                        min={DEFAULT_NEARBY_DISTANCE_KM}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{DEFAULT_NEARBY_DISTANCE_KM} km</span>
                        <span>50 km</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Default 5 km radius to highlight nearby retailers.
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => {
                      setPriceRange([minPrice, maxPrice]);
                      setQuantityRange([Math.min(minQuantity, 0), maxQuantity]);
                      setShowInStockOnly(false);
                      setMaxDistance(DEFAULT_NEARBY_DISTANCE_KM);
                    }}
                    className="w-full"
                  >
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
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
        ) : sortedProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                {...product}
                distance={product.distance}
                sellerName={product.seller_name}
                sellerLocation={product.seller_location}
                availability_date={product.availability_date}
              />
            ))}
          </div>
        ) : shopifyLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredShopifyProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredShopifyProducts.map((edge: any) => (
              <ShopifyProductCard key={edge.node.id} product={edge.node} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;