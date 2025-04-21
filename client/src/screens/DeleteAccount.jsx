// src/screens/DeleteAccount.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DeleteAccount = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone. All active tickets or travel options will be cancelled with refunds processed."
    );
    if (!confirmDelete) return;

    // For customers, email is stored under 'userEmail'; for providers, under 'providerEmail'
    const email = role === 'user' ? localStorage.getItem('userEmail') : localStorage.getItem('providerEmail');
    if (!email) {
      alert("Email not found. Please log in again.");
      navigate('/login');
      return;
    }

    try {
      // Choose endpoint based on role.
      const endpoint = role === 'user' ? '/deletecustomer' : '/deleteprovider';
      const response = await api.post(endpoint, { email });
      alert("Account deleted successfully.");
      // Remove email from localStorage.
      if (role === 'user') {
        localStorage.removeItem('userEmail');
      } else {
        localStorage.removeItem('providerEmail');
      }
      navigate('/');
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert("Failed to delete account: " + (error.response?.data || error.message));
    }
  };

  return (
    <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>Delete Account</h2>
      <p>
        Warning: This will permanently delete your account. All your active bookings (for users)
        or travel options (for providers) will be cancelled and refunds processed as per our policy.
      </p>
      <button className="btn" onClick={handleDelete}>
        Delete My Account
      </button>
      <button className="btn" onClick={() => navigate(-1)}>
        Cancel
      </button>
    </div>
  );
};

export default DeleteAccount;




