import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [status, setStatus] = useState(false);
  const [org, setOrg] = useState('');

  const updateUserDetails = useCallback(async (userEmailParam) => {
    const userEmail = userEmailParam || localStorage.getItem('userEmail');
    const providerEmail = userEmailParam || localStorage.getItem('providerEmail');

    if (!userEmail && !providerEmail) {
      console.error('No email provided for updateUserDetails.');
      return;
    }

    try {
      const endpoint = role === 'user' ? '/getcustomerdetails' : '/getproviderdetails';
      const res = await api.get(endpoint, { params: { email: role === 'user' ? userEmail : providerEmail } });

      console.log(endpoint);
      console.log(res);
      const user = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      setUserDetails(user);
    } catch (error) {
      console.error('Update details error:', error.response?.data || error.message);
      setUserDetails(null);
    }
  }, [role]); 

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        userDetails,
        setUserDetails,
        status,
        setStatus,
        org,
        setOrg,
        updateUserDetails,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

