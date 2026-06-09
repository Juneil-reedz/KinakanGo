import { createContext, useContext, useState, useEffect } from 'react';

const RiderContext = createContext();

export function useRider() {
  const context = useContext(RiderContext);
  if (!context) {
    throw new Error('useRider must be used within RiderProvider');
  }
  return context;
}

export function RiderProvider({ children }) {
  const [rider, setRider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock rider data
  const mockRider = {
    id: 1,
    name: 'Mike Johnson',
    email: 'rider@fooddelivery.com',
    phone: '+63 917 789 0123',
    vehicle: 'Motorcycle',
    licensePlate: 'ABC-1234',
    rating: 4.8,
    totalDeliveries: 1247,
    status: 'active',
  };

  useEffect(() => {
    // Check if rider is logged in (from localStorage)
    const savedRider = localStorage.getItem('rider');
    if (savedRider) {
      setRider(JSON.parse(savedRider));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock login - in production, this would call an API
    if (email && password) {
      const riderData = { ...mockRider, email };
      setRider(riderData);
      localStorage.setItem('rider', JSON.stringify(riderData));
      return { success: true, rider: riderData };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setRider(null);
    localStorage.removeItem('rider');
  };

  const updateRider = (updates) => {
    const updated = { ...rider, ...updates };
    setRider(updated);
    localStorage.setItem('rider', JSON.stringify(updated));
  };

  const value = {
    rider,
    isLoading,
    login,
    logout,
    updateRider,
    isAuthenticated: !!rider,
  };

  return (
    <RiderContext.Provider value={value}>
      {children}
    </RiderContext.Provider>
  );
}
