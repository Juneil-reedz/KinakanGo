import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email, password) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock authentication - in real app, verify with backend
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: email,
      phone: '+63 917 123 4567',
      addresses: [
        {
          id: 1,
          label: 'Home',
          street: 'Purok 5',
          apartment: '',
          city: 'Bongao',
          state: 'Tawi-Tawi',
          zipCode: '7500',
          barangay: 'Poblacion',
          isDefault: true,
        },
      ],
      paymentMethods: [
        {
          id: 1,
          type: 'card',
          cardType: 'visa',
          last4: '4242',
          expiryMonth: '12',
          expiryYear: '2025',
          isDefault: true,
        },
      ],
    };

    setUser(mockUser);
    setIsAuthenticated(true);
    return mockUser;
  };

  const register = async (userData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock registration - in real app, create user in backend
    const newUser = {
      id: Date.now(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      addresses: [],
      paymentMethods: [],
    };

    setUser(newUser);
    setIsAuthenticated(true);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const addAddress = (address) => {
    const newAddress = {
      id: Date.now(),
      ...address,
      isDefault: user.addresses.length === 0 || address.isDefault,
    };

    // If this is default, unset others
    let updatedAddresses = user.addresses.map((addr) => ({
      ...addr,
      isDefault: newAddress.isDefault ? false : addr.isDefault,
    }));

    updatedAddresses.push(newAddress);
    updateUser({ addresses: updatedAddresses });
    return newAddress;
  };

  const updateAddress = (addressId, updates) => {
    const updatedAddresses = user.addresses.map((addr) => {
      if (addr.id === addressId) {
        return { ...addr, ...updates };
      }
      // If updating to default, unset others
      if (updates.isDefault) {
        return { ...addr, isDefault: false };
      }
      return addr;
    });

    updateUser({ addresses: updatedAddresses });
  };

  const deleteAddress = (addressId) => {
    const updatedAddresses = user.addresses.filter((addr) => addr.id !== addressId);

    // If deleted address was default and there are others, make first one default
    if (updatedAddresses.length > 0) {
      const hadDefault = user.addresses.find((a) => a.id === addressId)?.isDefault;
      if (hadDefault) {
        updatedAddresses[0].isDefault = true;
      }
    }

    updateUser({ addresses: updatedAddresses });
  };

  const addPaymentMethod = (payment) => {
    const newPayment = {
      id: Date.now(),
      ...payment,
      isDefault: user.paymentMethods.length === 0 || payment.isDefault,
    };

    // If this is default, unset others
    let updatedPayments = user.paymentMethods.map((pm) => ({
      ...pm,
      isDefault: newPayment.isDefault ? false : pm.isDefault,
    }));

    updatedPayments.push(newPayment);
    updateUser({ paymentMethods: updatedPayments });
    return newPayment;
  };

  const updatePaymentMethod = (paymentId, updates) => {
    const updatedPayments = user.paymentMethods.map((pm) => {
      if (pm.id === paymentId) {
        return { ...pm, ...updates };
      }
      // If updating to default, unset others
      if (updates.isDefault) {
        return { ...pm, isDefault: false };
      }
      return pm;
    });

    updateUser({ paymentMethods: updatedPayments });
  };

  const deletePaymentMethod = (paymentId) => {
    const updatedPayments = user.paymentMethods.filter((pm) => pm.id !== paymentId);

    // If deleted payment was default and there are others, make first one default
    if (updatedPayments.length > 0) {
      const hadDefault = user.paymentMethods.find((p) => p.id === paymentId)?.isDefault;
      if (hadDefault) {
        updatedPayments[0].isDefault = true;
      }
    }

    updateUser({ paymentMethods: updatedPayments });
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    addAddress,
    updateAddress,
    deleteAddress,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
