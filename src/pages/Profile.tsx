import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin } from 'lucide-react';
import { GeoJsonPointFeature, GeoJsonSearchResult, searchGeoJsonLocation, toGeoJsonPoint } from '@/lib/geolocation';

type ProfileFormState = {
  full_name: string;
  phone: string;
  address: string;
  location_lat: string;
  location_lng: string;
  location_geojson: GeoJsonPointFeature | null;
};

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileFormState>({
    full_name: '',
    phone: '',
    address: '',
    location_lat: '',
    location_lng: '',
    location_geojson: null,
  });
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<GeoJsonSearchResult[]>([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const isRetailer = userRole === 'retailer';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    setUserRole(roleData?.role || null);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileData) {
      setProfile({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        location_lat: profileData.location_lat ? String(profileData.location_lat) : '',
        location_lng: profileData.location_lng ? String(profileData.location_lng) : '',
        location_geojson: (profileData.location_geojson as GeoJsonPointFeature) || null,
      });
      if (profileData.address) {
        setLocationQuery(profileData.address);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const latNumber = profile.location_lat ? Number(profile.location_lat) : null;
      const lngNumber = profile.location_lng ? Number(profile.location_lng) : null;

      const payload = {
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        location_lat: latNumber,
        location_lng: lngNumber,
        location_geojson:
          profile.location_geojson ||
          (latNumber !== null && lngNumber !== null
            ? toGeoJsonPoint(latNumber, lngNumber, { source: 'manual-entry' })
            : null),
      };

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', session.user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) {
      toast({
        title: 'Enter a location',
        description: 'Type an address or landmark to search for it',
        variant: 'destructive',
      });
      return;
    }

    setLocationSearchLoading(true);
    try {
      const results = await searchGeoJsonLocation(locationQuery, 5);
      setLocationResults(results);
      if (results.length === 0) {
        toast({
          title: 'No results',
          description: 'Try refining your search query',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Geo search failed',
        description: error.message ?? 'Unable to fetch GeoJSON data',
        variant: 'destructive',
      });
    } finally {
      setLocationSearchLoading(false);
    }
  };

  const handleSelectLocation = (result: GeoJsonSearchResult) => {
    setProfile((prev) => ({
      ...prev,
      address: prev.address || result.displayName,
      location_lat: result.lat.toString(),
      location_lng: result.lng.toString(),
      location_geojson: result.feature,
    }));
    setLocationQuery(result.displayName);
    setLocationResults([]);
    toast({
      title: 'Location pinned',
      description: 'Coordinates captured from GeoJSON result',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={userRole} />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">My Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Enter your address"
                />
              </div>

              {isRetailer && (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Store Location (GeoJSON)</p>
                      <p className="text-sm text-muted-foreground">
                        Search for your storefront and pin it so customers can discover nearby retailers within 5 km.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Search address or landmark..."
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={handleLocationSearch}
                      disabled={locationSearchLoading}
                    >
                      {locationSearchLoading ? 'Searching...' : 'Search GeoJSON'}
                    </Button>
                  </div>
                  {locationResults.length > 0 && (
                    <div className="space-y-2 rounded-md border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Select a result</p>
                      {locationResults.map((result) => (
                        <button
                          key={`${result.lat}-${result.lng}`}
                          type="button"
                          className="w-full rounded-md border px-3 py-2 text-left hover:bg-muted transition"
                          onClick={() => handleSelectLocation(result)}
                        >
                          <p className="font-medium">{result.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        value={profile.location_lat}
                        placeholder="e.g. -1.2921"
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            location_lat: e.target.value,
                            location_geojson: null,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        value={profile.location_lng}
                        placeholder="e.g. 36.8219"
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            location_lng: e.target.value,
                            location_geojson: null,
                          }))
                        }
                      />
                    </div>
                  </div>
                  {profile.location_lat && profile.location_lng && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${profile.location_lat},${profile.location_lng}`,
                          '_blank'
                        )
                      }
                    >
                      Preview on map
                    </Button>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;