// src/screens/DepositFunds.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DepositFunds = () => {
  const [amount, setAmount] = useState('');
  const navigate = useNavigate();
  const { updateUserDetails } = useAuth();

  const handleDeposit = async () => {
    try {
      // Retrieve the customer email from localStorage (set at login)
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        alert("Customer email not found. Please log in again.");
        return;
      }
      // Pass the email as a query parameter
      await api.post(`/depositfunds?email=${encodeURIComponent(userEmail)}`, { amount });
      alert("Funds deposited successfully!");
      await updateUserDetails(userEmail);
      navigate('/userhome');
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert("Error depositing funds");
    }
  };

  return (
    <div className="container deposit-funds">
      <h2>Deposit Funds</h2>
      <div className="inputDiv">
        <label>Amount:</label><br />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="inputField"
        /><br />
        <button className="btn" onClick={handleDeposit}>Deposit</button>
      </div>
      <button className="btn" onClick={() => navigate('/userhome')}>Back to Home</button>
    </div>
  );
};

export default DepositFunds;




