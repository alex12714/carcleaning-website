export interface Service {
  id: string;
  nameKey: string;
  price: number;
  category: 'full' | 'interior' | 'exterior' | 'additional' | 'delivery';
  popular?: boolean;
}

export const services: Service[] = [
  // Full Package
  { id: 'fullCar', nameKey: 'items.fullCar', price: 250, category: 'full', popular: true },
  
  // Interior Services
  { id: 'frontSeats', nameKey: 'items.frontSeats', price: 35, category: 'interior' },
  { id: 'backSeats', nameKey: 'items.backSeats', price: 35, category: 'interior' },
  { id: 'ceiling', nameKey: 'items.ceiling', price: 40, category: 'interior' },
  { id: 'trunk', nameKey: 'items.trunk', price: 25, category: 'interior' },
  { id: 'safetyBelts', nameKey: 'items.safetyBelts', price: 15, category: 'interior' },
  { id: 'carpets', nameKey: 'items.carpets', price: 30, category: 'interior' },
  { id: 'dashboard', nameKey: 'items.dashboard', price: 25, category: 'interior' },
  { id: 'doorPanels', nameKey: 'items.doorPanels', price: 20, category: 'interior' },
  
  // Exterior Services
  { id: 'exteriorWash', nameKey: 'items.exteriorWash', price: 45, category: 'exterior', popular: true },
  { id: 'frontLights', nameKey: 'items.frontLights', price: 35, category: 'exterior' },
  { id: 'backLights', nameKey: 'items.backLights', price: 30, category: 'exterior' },
  { id: 'wheelsCleaning', nameKey: 'items.wheelsCleaning', price: 25, category: 'exterior' },
  { id: 'windowTinting', nameKey: 'items.windowTinting', price: 30, category: 'exterior' },
  
  // Additional Services
  { id: 'rustCleaning', nameKey: 'items.rustCleaning', price: 50, category: 'additional' },
  { id: 'engineBay', nameKey: 'items.engineBay', price: 55, category: 'additional' },
  
  // Pickup & Delivery
  { id: 'pickup', nameKey: 'items.pickup', price: 20, category: 'delivery' },
  { id: 'delivery', nameKey: 'items.delivery', price: 20, category: 'delivery' },
];

export const getServicesByCategory = (category: Service['category']) => 
  services.filter(s => s.category === category);

export const calculateTotal = (selectedIds: string[]): number => {
  // If full car is selected, use its price and ignore individual interior items
  if (selectedIds.includes('fullCar')) {
    const fullCarPrice = services.find(s => s.id === 'fullCar')?.price || 250;
    const additionalServices = services.filter(
      s => selectedIds.includes(s.id) && 
      s.category !== 'full' && 
      s.category !== 'interior'
    );
    return fullCarPrice + additionalServices.reduce((sum, s) => sum + s.price, 0);
  }
  
  return services
    .filter(s => selectedIds.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);
};
