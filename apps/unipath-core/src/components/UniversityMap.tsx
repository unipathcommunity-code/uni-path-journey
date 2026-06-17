import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapUniversity {
  id: string;
  name: string;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  ranking: number | null;
}

interface UniversityMapProps {
  universities: MapUniversity[];
  onSelect?: (id: string) => void;
  className?: string;
}

function FitBounds({ universities }: { universities: MapUniversity[] }) {
  const map = useMap();
  
  useEffect(() => {
    const validUnis = universities.filter(u => u.latitude && u.longitude);
    if (validUnis.length === 0) return;
    
    const bounds = L.latLngBounds(
      validUnis.map(u => [u.latitude!, u.longitude!] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [universities, map]);

  return null;
}

export function UniversityMap({ universities, onSelect, className = '' }: UniversityMapProps) {
  const validUnis = universities.filter(u => u.latitude && u.longitude);

  if (validUnis.length === 0) return null;

  const center = validUnis.length > 0
    ? [validUnis[0].latitude!, validUnis[0].longitude!] as [number, number]
    : [41.3, 69.3] as [number, number];

  return (
    <div className={`rounded-2xl overflow-hidden border border-border ${className}`}>
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds universities={validUnis} />
        {validUnis.map(uni => (
          <Marker
            key={uni.id}
            position={[uni.latitude!, uni.longitude!]}
            eventHandlers={{
              click: () => onSelect?.(uni.id),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{uni.name}</p>
                <p className="text-muted-foreground">
                  {uni.city}, {uni.country}
                </p>
                {uni.ranking && (
                  <p className="text-xs mt-1">Ranking: #{uni.ranking}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
