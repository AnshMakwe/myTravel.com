// src/screens/UpdateProviderDetails.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const UpdateProviderDetails = () => {
  const [newName, setNewName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newRating, setNewRating] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const navigate = useNavigate();
  const { updateUserDetails } = useAuth();
  const handleUpdate = async () => {
    try {
      await api.post('/updateproviderdetails', { providerEmail: localStorage.getItem('providerEmail'), newName, newContact, newRating:5, isAnonymous });
      alert("Profile updated successfully!");
      updateUserDetails();
      navigate('/providerhome');
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert("Error updating profile");
    }
  };

  return (
    <div className="container">
      <h2>Update Provider Details</h2>
      <div className="inputDiv">
        <label>New Name:</label><br />
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="inputField" /><br />
        <label>New Contact:</label><br />
        <input type="text" value={newContact} onChange={(e) => setNewContact(e.target.value)} className="inputField" /><br />
        
        <button className="btn" onClick={handleUpdate}>Update Details</button>
      </div>
      <button className="btn" onClick={() => navigate('/providerhome')}>Back</button>
    </div>
  );
};

export default UpdateProviderDetails;




