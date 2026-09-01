// Store Reference Location: Saddar, Karachi
export const STORE_COORDINATES = { lat: 24.8607, lng: 67.0011 };

export const calculateDistanceDeliveryFee = (distanceKm) => {
  const d = Math.max(0, Number(distanceKm) || 0);
  const baseFee = 250;
  const baseKm = 15;
  const perKmRate = 30;
  if (d <= baseKm) {
    return baseFee;
  }
  const extraKm = Math.ceil(d - baseKm);
  return baseFee + (extraKm * perKmRate);
};

export const DELIVERY_ZONES = [
  { 
    id: 'zone-std-1', 
    name: 'Standard Distance (Up to 15 km)', 
    fee: 250, 
    minOrder: 0, 
    distanceKm: 10
  },
  { 
    id: 'zone-std-2', 
    name: 'Extended Distance (16 – 20 km)', 
    fee: 340, 
    minOrder: 300, 
    distanceKm: 18
  },
  { 
    id: 'zone-std-3', 
    name: 'Outer Distance (21 – 25 km)', 
    fee: 490, 
    minOrder: 400, 
    distanceKm: 23
  },
  { 
    id: 'zone-std-4', 
    name: 'Far Distance (26 – 30 km)', 
    fee: 640, 
    minOrder: 500, 
    distanceKm: 28
  }
];

// Haversine formula distance calculation in kilometers
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};
