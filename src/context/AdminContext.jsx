import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock admin data
  const mockAdmin = {
    id: 1,
    name: 'Admin User',
    email: 'admin@fooddelivery.com',
    role: 'super_admin',
    permissions: ['all'],
  };

  useEffect(() => {
    // Check if admin is logged in (from localStorage)
    const savedAdmin = localStorage.getItem('admin');
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock login - in production, this would call an API
    if (email && password) {
      const adminData = { ...mockAdmin, email };
      setAdmin(adminData);
      localStorage.setItem('admin', JSON.stringify(adminData));
      return { success: true, admin: adminData };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin');
  };

  const value = {
    admin,
    isLoading,
    login,
    logout,
    isAuthenticated: !!admin,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
