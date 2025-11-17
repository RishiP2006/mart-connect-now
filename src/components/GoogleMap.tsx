import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface GoogleMapProps {
  lat: number;
  lng: number;
  sellerName?: string;
  address?: string;
  height?: string;
}

export const GoogleMap = ({ lat, lng, sellerName, address, height = '400px' }: GoogleMapProps) => {
  // Google Maps Embed API URL (no API key required for basic embedding)
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${lat},${lng}&zoom=15`;

  // Fallback to static map if no API key
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x400&markers=color:red%7C${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}`;

  const hasApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {sellerName ? `${sellerName}'s Location` : 'Location'}
        </CardTitle>
        {address && (
          <p className="text-sm text-muted-foreground">{address}</p>
        )}
      </CardHeader>
      <CardContent>
        {hasApiKey ? (
          <iframe
            width="100%"
            height={height}
            style={{ border: 0, borderRadius: '8px' }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
            title="Seller Location"
          />
        ) : (
          <div className="space-y-2">
            <img
              src={staticMapUrl}
              alt="Location Map"
              className="w-full rounded-lg"
              style={{ height }}
            />
            <p className="text-xs text-muted-foreground text-center">
              Add VITE_GOOGLE_MAPS_API_KEY to environment variables for interactive map
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline block text-center"
            >
              Open in Google Maps
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

