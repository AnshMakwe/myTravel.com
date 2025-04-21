// src/screens/UpdateCustomerDetails.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const UpdateCustomerDetails = () => {
  const [newName, setNewName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const navigate = useNavigate();
  const { updateUserDetails } = useAuth();

  const handleUpdate = async () => {
    try {
      // Retrieve the customer's email from localStorage (set at login)
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        alert("Customer email not found. Please log in again.");
        return;
      }
      // Pass the email as a query parameter
      await api.post(`/updatecustomerdetails?email=${encodeURIComponent(userEmail)}`, { newName, newContact, isAnonymous });
      alert("Profile updated successfully!");
      await updateUserDetails(userEmail);
      navigate('/userhome');
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert("Error updating profile");
    }
  };

  return (
    <div className="container">
      <h2>Update Customer Details</h2>
      <div className="inputDiv">
        <label>New Name:</label><br />
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="inputField" /><br />
        <label>New Contact:</label><br />
        <input type="text" value={newContact} onChange={(e) => setNewContact(e.target.value)} className="inputField" /><br />
        <label>
          <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} /> Make Profile Anonymous
        </label><br />
        <button className="btn" onClick={handleUpdate}>Update Details</button>
      </div>
      <button className="btn" onClick={() => navigate('/userhome')}>Back</button>
    </div>
  );
};

export default UpdateCustomerDetails;




